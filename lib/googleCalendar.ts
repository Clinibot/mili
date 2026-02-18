import { google } from 'googleapis';
import { supabase } from './supabaseClient';
import Retell from 'retell-sdk';

const SCOPES = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly',
];

export function getOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`
    );
}

export function getAuthUrl(clientId: string): string {
    const oauth2Client = getOAuth2Client();
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
        state: clientId, // Pass client_id so we know who is connecting
    });
}

export async function getTokensFromCode(code: string) {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

/**
 * Get an authenticated Google Calendar client for a given client_id.
 * Automatically refreshes the access token if expired.
 */
export async function getCalendarClient(clientId: string) {
    const { data: tokenData, error } = await supabase
        .from('google_calendar_tokens')
        .select('*')
        .eq('client_id', clientId)
        .single();

    if (error || !tokenData) {
        throw new Error('Google Calendar no conectado para este cliente');
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expiry_date: new Date(tokenData.token_expiry).getTime(),
    });

    // Check if token is expired and refresh
    const now = Date.now();
    const expiry = new Date(tokenData.token_expiry).getTime();
    if (now >= expiry - 60000) {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);

        // Update stored tokens
        await supabase
            .from('google_calendar_tokens')
            .update({
                access_token: credentials.access_token,
                token_expiry: new Date(credentials.expiry_date || Date.now() + 3600000).toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('client_id', clientId);
    }

    return {
        calendar: google.calendar({ version: 'v3', auth: oauth2Client }),
        calendarId: tokenData.calendar_id || 'primary',
    };
}

/**
 * Identify the client from the webhook token in the request URL.
 * Retell calls our endpoint with ?token=WEBHOOK_TOKEN
 */
export async function getClientIdFromToken(token: string): Promise<string | null> {
    const { data } = await supabase
        .from('clients')
        .select('id')
        .eq('webhook_token', token)
        .single();

    return data?.id || null;
}

/**
 * Register the 4 calendar tools on the client's Retell agent LLM using the SDK.
 */
export async function registerCalendarToolsOnAgent(clientId: string) {
    // 1. Get client's Retell API key and agent ID
    const { data: client } = await supabase
        .from('clients')
        .select('api_key_retail, agent_id, webhook_token')
        .eq('id', clientId)
        .single();

    if (!client?.api_key_retail || !client?.agent_id) {
        throw new Error('Cliente sin API key o Agent ID de Retell');
    }

    const apiKey = client.api_key_retail;
    const agentId = client.agent_id;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://centrodemando.es';
    const token = client.webhook_token;

    if (!token) {
        throw new Error('Cliente sin webhook_token. Genere uno primero.');
    }

    // Initialize Retell SDK
    const retellClient = new Retell({ apiKey });

    // 2. Get the agent to find the LLM ID
    const agent = await retellClient.agent.retrieve(agentId);
    console.log('Agent retrieved:', agent);

    const llmId = (agent.response_engine as any)?.llm_id;

    if (!llmId) throw new Error('No se encontró LLM ID en el agente');

    // 3. Get the current LLM config
    const llmData = await retellClient.llm.retrieve(llmId);

    const calendarTools: any[] = [
        {
            type: 'custom',
            name: 'consultar_agenda',
            description: 'Consulta las citas OCUPADAS en la agenda para un rango de fechas. Devuelve la lista de citas existentes (horas ocupadas). Tú debes analizar los huecos entre las citas para determinar qué horas están LIBRES. La fecha y hora actual es {{current_time_Europe/Madrid}}. Si el usuario dice "mañana", "pasado mañana", "este jueves", etc., calcula la fecha correcta en formato YYYY-MM-DD.',
            url: `${baseUrl}/api/calendar/tools/list-events?token=${token}`,
            method: 'POST',
            speak_during_execution: true,
            speak_after_execution: true,
            execution_message_description: 'Dame un momento, estoy consultando la agenda...',
            parameters: {
                type: 'object',
                properties: {
                    date_from: { type: 'string', description: 'Fecha inicio en formato YYYY-MM-DD. Calcula la fecha correcta a partir de {{current_time_Europe/Madrid}} si el usuario dice "mañana", "el lunes", etc.' },
                    date_to: { type: 'string', description: 'Fecha fin en formato YYYY-MM-DD. Si no se indica, es igual a date_from. Para buscar alternativas en días cercanos, pon un rango de 2-3 días.' },
                },
                required: ['date_from'],
            },
        },
        {
            type: 'custom',
            name: 'agendar_cita',
            description: 'Crea una nueva cita en la agenda. SOLO usa esta herramienta DESPUÉS de haber consultado la disponibilidad con consultar_agenda y haber confirmado con el usuario la fecha y hora. La fecha y hora actual es {{current_time_Europe/Madrid}}. El teléfono del usuario es {{user_number}}.',
            url: `${baseUrl}/api/calendar/tools/create-event?token=${token}`,
            method: 'POST',
            speak_during_execution: true,
            speak_after_execution: true,
            execution_message_description: 'Perfecto, estoy reservando tu cita...',
            parameters: {
                type: 'object',
                properties: {
                    summary: { type: 'string', description: 'Título de la cita. Formato: "Cita - [Nombre del usuario] - [Motivo]"' },
                    date: { type: 'string', description: 'Fecha de la cita en formato YYYY-MM-DD. Calcula a partir de {{current_time_Europe/Madrid}}.' },
                    start_time: { type: 'string', description: 'Hora de inicio en formato HH:MM (24h), ejemplo: "10:30"' },
                    end_time: { type: 'string', description: 'Hora de fin en formato HH:MM (24h), ejemplo: "11:00". Por defecto, 30 minutos después de start_time.' },
                    description: { type: 'string', description: 'Incluir: Nombre, Teléfono ({{user_number}}), y Motivo de la cita.' },
                    attendee_name: { type: 'string', description: 'Nombre completo del usuario/paciente' },
                    attendee_phone: { type: 'string', description: 'Teléfono del usuario. Usa {{user_number}} por defecto.' },
                },
                required: ['summary', 'date', 'start_time', 'end_time', 'attendee_name'],
            },
        },
        {
            type: 'custom',
            name: 'reagendar_cita',
            description: 'Cambia la fecha u hora de una cita existente. Úsalo cuando el usuario quiera mover, cambiar o reagendar una cita ya existente. La fecha y hora actual es {{current_time_Europe/Madrid}}.',
            url: `${baseUrl}/api/calendar/tools/update-event?token=${token}`,
            method: 'POST',
            speak_during_execution: true,
            speak_after_execution: true,
            execution_message_description: 'Modificando la cita...',
            parameters: {
                type: 'object',
                properties: {
                    attendee_name: { type: 'string', description: 'Nombre de la persona cuya cita se quiere reagendar (para buscar la cita)' },
                    original_date: { type: 'string', description: 'Fecha original de la cita en formato YYYY-MM-DD (para buscar la cita)' },
                    new_date: { type: 'string', description: 'Nueva fecha en formato YYYY-MM-DD' },
                    new_start_time: { type: 'string', description: 'Nueva hora de inicio en formato HH:MM' },
                    new_end_time: { type: 'string', description: 'Nueva hora de fin en formato HH:MM' },
                },
                required: ['attendee_name', 'new_date', 'new_start_time', 'new_end_time'],
            },
        },
        {
            type: 'custom',
            name: 'cancelar_cita',
            description: 'Cancela una cita existente buscándola por el teléfono del usuario. La cita solo se puede cancelar si el teléfono del que llama ({{user_number}}) coincide con el teléfono registrado en la cita. La fecha y hora actual es {{current_time_Europe/Madrid}}.',
            url: `${baseUrl}/api/calendar/tools/delete-event?token=${token}`,
            method: 'POST',
            speak_during_execution: true,
            speak_after_execution: true,
            execution_message_description: 'Buscando tu cita para cancelarla...',
            parameters: {
                type: 'object',
                properties: {
                    user_phone: { type: 'string', description: 'Teléfono del usuario que solicita la cancelación. Usa {{user_number}}.' },
                    date: { type: 'string', description: 'Fecha de la cita a cancelar en formato YYYY-MM-DD. Calcula a partir de {{current_time_Europe/Madrid}}. Si el usuario no indica fecha, buscar en los próximos 7 días.' },
                },
                required: ['user_phone'],
            },
        },
    ];

    // 5. Merge with existing tools
    const existingTools = (llmData.general_tools || []).filter(
        (t: any) => !['consultar_agenda', 'agendar_cita', 'reagendar_cita', 'cancelar_cita'].includes(t.name)
    );
    const allTools = [...existingTools, ...calendarTools];

    // 6. Append calendar instructions to the general prompt
    const calendarPromptAddition = `\n\n## Gestión de Agenda\nTienes acceso a la agenda del calendario en tiempo real. La fecha y hora actual es {{current_time_Europe/Madrid}}. El teléfono del usuario que llama es {{user_number}}.\n\n### Cálculo de fechas\nSi el usuario dice "mañana", "pasado mañana", "el lunes", "este viernes", etc., calcula la fecha correcta en formato YYYY-MM-DD basándote en {{current_time_Europe/Madrid}}.\n\n### Flujo de trabajo para agendar una cita:\n1. **Pregunta fecha y hora**: Cuando el usuario quiera una cita, pregúntale qué día y hora prefiere.\n2. **Consulta disponibilidad**: USA "consultar_agenda" para ver las citas OCUPADAS de ese día. La herramienta devuelve las horas que YA están cogidas. Los huecos entre esas citas son los horarios DISPONIBLES.\n3. **Si la hora solicitada está LIBRE**: Confírmale al usuario: "Perfecto, tengo disponibilidad el [día] a las [hora]. ¿Confirmamos la cita?"\n4. **Si la hora solicitada está OCUPADA**: Ofrece 2 alternativas cercanas:\n   - La primera hora libre inmediatamente después de la solicitada ese mismo día.\n   - La misma hora solicitada pero al día siguiente laborable (consulta ese día también con consultar_agenda).\n   Ejemplo: "Lo siento, a las 9 ya hay una cita. Tengo libre a las 9:30 del mismo día, o a las 9:00 del miércoles. ¿Cuál prefieres?"\n5. **Cuando el usuario confirme**: Pide su nombre completo y el motivo de la cita. El teléfono ya lo tienes ({{user_number}}).\n6. **Agendar**: USA "agendar_cita" con todos los datos:\n   - summary: "Cita - [Nombre] - [Motivo]"\n   - description: "Nombre: [nombre]\\nTeléfono: {{user_number}}\\nMotivo: [motivo]"\n   - attendee_name: nombre del usuario\n   - attendee_phone: {{user_number}}\n   - Si no se dice duración, las citas duran 30 minutos por defecto.\n\n### Flujo para cancelar una cita:\n1. El usuario pide cancelar → USA "cancelar_cita" pasando user_phone={{user_number}}.\n2. La herramienta buscará citas asociadas a ese teléfono y las cancelará.\n3. Si no se encuentra ninguna cita con ese teléfono, informa al usuario.\n4. Si el usuario da una fecha, pásala también para acotar la búsqueda.\n\n### Reglas importantes:\n- NUNCA inventes disponibilidad. Siempre consulta primero.\n- Si hay conflicto al intentar agendar, infórmalo y ofrece alternativas.\n- Siempre confirma la fecha completa (día, mes) y hora antes de agendar.\n- No preguntes el teléfono, ya lo tienes en {{user_number}}.`;

    let generalPrompt = llmData.general_prompt || '';
    // Remove old calendar section if exists, then add updated one
    const calendarSectionRegex = /\n\n## Gestión de Agenda[\s\S]*$/;
    generalPrompt = generalPrompt.replace(calendarSectionRegex, '');
    generalPrompt += calendarPromptAddition;

    // 7. Update the LLM
    await retellClient.llm.update(llmId, {
        general_tools: allTools,
        general_prompt: generalPrompt,
    });

    return true;
}

/**
 * Remove calendar tools from the client's Retell agent LLM.
 */
export async function removeCalendarToolsFromAgent(clientId: string) {
    const { data: client } = await supabase
        .from('clients')
        .select('api_key_retail, agent_id')
        .eq('id', clientId)
        .single();

    if (!client?.api_key_retail || !client?.agent_id) return;

    const apiKey = client.api_key_retail;
    const agentId = client.agent_id;

    const retellClient = new Retell({ apiKey });

    try {
        const agent = await retellClient.agent.retrieve(agentId);
        const llmId = (agent.response_engine as any)?.llm_id;
        if (!llmId) return;

        const llmData = await retellClient.llm.retrieve(llmId);

        const calendarToolNames = ['consultar_agenda', 'agendar_cita', 'reagendar_cita', 'cancelar_cita'];
        const filteredTools = (llmData.general_tools || []).filter(
            (t: any) => !calendarToolNames.includes(t.name)
        );

        let generalPrompt = llmData.general_prompt || '';
        // Remove calendar section from prompt (greedy match to end of string)
        const calendarSectionRegex = /\n\n## Gestión de Agenda[\s\S]*$/;
        generalPrompt = generalPrompt.replace(calendarSectionRegex, '');

        await retellClient.llm.update(llmId, {
            general_tools: filteredTools,
            general_prompt: generalPrompt,
        });

    } catch (error) {
        console.error('Error removing tools from Retell:', error);
    }
}
