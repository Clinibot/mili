import { google } from 'googleapis';
import { supabase } from './supabaseClient';

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
 * Register the 4 calendar tools on the client's Retell agent LLM.
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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const token = client.webhook_token;

    // 2. Get the agent to find the LLM ID
    const agentRes = await fetch(`https://api.retellai.com/v2/agent/${agentId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!agentRes.ok) throw new Error(`Error fetching agent: ${agentRes.status}`);
    const agentData = await agentRes.json();
    const llmId = agentData.response_engine?.llm_id;
    if (!llmId) throw new Error('No se encontró LLM ID en el agente');

    // 3. Get the current LLM config
    const llmRes = await fetch(`https://api.retellai.com/v2/retell-llm/${llmId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!llmRes.ok) throw new Error(`Error fetching LLM: ${llmRes.status}`);
    const llmData = await llmRes.json();

    // 4. Build the 4 calendar tools
    const calendarTools = [
        {
            type: 'custom',
            name: 'consultar_agenda',
            description: 'Consulta las citas y disponibilidad en la agenda. Úsalo cuando el usuario pregunte por disponibilidad, quiera saber si hay hueco, o quiera ver sus citas programadas.',
            url: `${baseUrl}/api/calendar/tools/list-events?token=${token}`,
            speak_during_execution: true,
            speak_on_send: 'Un momento, déjame consultar la agenda...',
            parameters: {
                type: 'object',
                properties: {
                    date_from: { type: 'string', description: 'Fecha inicio en formato YYYY-MM-DD. Si el usuario dice "mañana", calcula la fecha.' },
                    date_to: { type: 'string', description: 'Fecha fin en formato YYYY-MM-DD. Si no se indica, es igual a date_from.' },
                },
                required: ['date_from'],
            },
        },
        {
            type: 'custom',
            name: 'agendar_cita',
            description: 'Crea una nueva cita en la agenda. Úsalo cuando el usuario quiera agendar, reservar o pedir cita. Antes de agendar, confirma fecha, hora y nombre con el usuario.',
            url: `${baseUrl}/api/calendar/tools/create-event?token=${token}`,
            speak_during_execution: true,
            speak_on_send: 'Perfecto, estoy agendando tu cita...',
            parameters: {
                type: 'object',
                properties: {
                    summary: { type: 'string', description: 'Título de la cita, ejemplo: "Cita con Juan García"' },
                    date: { type: 'string', description: 'Fecha de la cita en formato YYYY-MM-DD' },
                    start_time: { type: 'string', description: 'Hora de inicio en formato HH:MM (24h), ejemplo: "10:30"' },
                    end_time: { type: 'string', description: 'Hora de fin en formato HH:MM (24h), ejemplo: "11:00"' },
                    description: { type: 'string', description: 'Notas adicionales o motivo de la cita' },
                    attendee_name: { type: 'string', description: 'Nombre del paciente o cliente' },
                    attendee_phone: { type: 'string', description: 'Teléfono del paciente o cliente' },
                },
                required: ['summary', 'date', 'start_time', 'end_time'],
            },
        },
        {
            type: 'custom',
            name: 'reagendar_cita',
            description: 'Cambia la fecha u hora de una cita existente. Úsalo cuando el usuario quiera mover, cambiar o reagendar una cita ya existente.',
            url: `${baseUrl}/api/calendar/tools/update-event?token=${token}`,
            speak_during_execution: true,
            speak_on_send: 'Estoy modificando la cita...',
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
            description: 'Cancela una cita existente. Úsalo cuando el usuario quiera cancelar, anular o eliminar una cita.',
            url: `${baseUrl}/api/calendar/tools/delete-event?token=${token}`,
            speak_during_execution: true,
            speak_on_send: 'Voy a cancelar la cita...',
            parameters: {
                type: 'object',
                properties: {
                    attendee_name: { type: 'string', description: 'Nombre de la persona cuya cita se quiere cancelar' },
                    date: { type: 'string', description: 'Fecha de la cita a cancelar en formato YYYY-MM-DD' },
                },
                required: ['attendee_name', 'date'],
            },
        },
    ];

    // 5. Merge with existing tools (remove old calendar tools if any)
    const existingTools = (llmData.general_tools || []).filter(
        (t: any) => !['consultar_agenda', 'agendar_cita', 'reagendar_cita', 'cancelar_cita'].includes(t.name)
    );
    const allTools = [...existingTools, ...calendarTools];

    // 6. Append calendar instructions to the general prompt
    const calendarPromptAddition = `\n\n## Gestión de Agenda\nTienes acceso a la agenda del calendario. Puedes:\n- Consultar citas y disponibilidad usando "consultar_agenda"\n- Agendar nuevas citas usando "agendar_cita"\n- Reagendar citas existentes usando "reagendar_cita"\n- Cancelar citas usando "cancelar_cita"\nCuando el usuario quiera una cita, primero consulta disponibilidad del día solicitado, confirma los datos con el usuario, y luego agenda. Siempre confirma fecha, hora y nombre antes de agendar o modificar.`;

    let generalPrompt = llmData.general_prompt || '';
    if (!generalPrompt.includes('## Gestión de Agenda')) {
        generalPrompt += calendarPromptAddition;
    }

    // 7. Update the LLM
    const updateRes = await fetch(`https://api.retellai.com/v2/retell-llm/${llmId}`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            general_tools: allTools,
            general_prompt: generalPrompt,
        }),
    });

    if (!updateRes.ok) {
        const errBody = await updateRes.text();
        throw new Error(`Error updating LLM: ${updateRes.status} - ${errBody}`);
    }

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

    const agentRes = await fetch(`https://api.retellai.com/v2/agent/${agentId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!agentRes.ok) return;
    const agentData = await agentRes.json();
    const llmId = agentData.response_engine?.llm_id;
    if (!llmId) return;

    const llmRes = await fetch(`https://api.retellai.com/v2/retell-llm/${llmId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!llmRes.ok) return;
    const llmData = await llmRes.json();

    const calendarToolNames = ['consultar_agenda', 'agendar_cita', 'reagendar_cita', 'cancelar_cita'];
    const filteredTools = (llmData.general_tools || []).filter(
        (t: any) => !calendarToolNames.includes(t.name)
    );

    let generalPrompt = llmData.general_prompt || '';
    // Remove calendar section from prompt
    const calendarSectionRegex = /\n\n## Gestión de Agenda[\s\S]*?(?=\n\n##|\n*$)/;
    generalPrompt = generalPrompt.replace(calendarSectionRegex, '');

    await fetch(`https://api.retellai.com/v2/retell-llm/${llmId}`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            general_tools: filteredTools,
            general_prompt: generalPrompt,
        }),
    });
}
