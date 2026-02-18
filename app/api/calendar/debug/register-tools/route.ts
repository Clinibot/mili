import { NextRequest, NextResponse } from 'next/server';
import { registerCalendarToolsOnAgent } from '@/lib/googleCalendar';
import { supabase } from '@/lib/supabaseClient';
import Retell from 'retell-sdk';

export async function POST(req: NextRequest) {
    try {
        const { client_id } = await req.json();

        if (!client_id) {
            return NextResponse.json({ error: 'client_id is required' }, { status: 400 });
        }

        // Get full client info for debugging
        const { data: client, error } = await supabase
            .from('clients')
            .select('id, name, api_key_retail, agent_id, webhook_token')
            .eq('id', client_id)
            .single();

        if (error || !client) {
            return NextResponse.json({ error: 'Client not found', details: error?.message }, { status: 404 });
        }

        const debugInfo: any = {
            client_name: client.name,
            has_api_key: !!client.api_key_retail,
            has_agent_id: !!client.agent_id,
            agent_id: client.agent_id,
            has_webhook_token: !!client.webhook_token,
            webhook_token_preview: client.webhook_token ? client.webhook_token.substring(0, 8) + '...' : 'MISSING',
        };

        if (!client.api_key_retail || !client.agent_id) {
            return NextResponse.json({
                error: 'Missing api_key_retail or agent_id',
                debug: debugInfo
            }, { status: 400 });
        }

        if (!client.webhook_token) {
            return NextResponse.json({
                error: 'Missing webhook_token. This column may not exist in the clients table.',
                debug: debugInfo
            }, { status: 400 });
        }

        // Try to retrieve agent info before registering
        try {
            const retellClient = new Retell({ apiKey: client.api_key_retail });
            const agent = await retellClient.agent.retrieve(client.agent_id);
            const llmId = (agent.response_engine as any)?.llm_id;
            debugInfo.llm_id = llmId || 'NOT FOUND';
            debugInfo.response_engine_type = (agent.response_engine as any)?.type || 'unknown';

            if (llmId) {
                const llm = await retellClient.llm.retrieve(llmId);
                debugInfo.current_tools_count = llm.general_tools?.length || 0;
                debugInfo.current_tool_names = (llm.general_tools || []).map((t: any) => t.name);
                debugInfo.has_general_prompt = !!llm.general_prompt;
                debugInfo.prompt_length = llm.general_prompt?.length || 0;
            }
        } catch (sdkErr: any) {
            debugInfo.sdk_error = sdkErr.message;
        }

        console.log(`[DEBUG] Registering tools for client: ${client.name}`, debugInfo);

        await registerCalendarToolsOnAgent(client.id);

        // Re-check after registration
        try {
            const retellClient = new Retell({ apiKey: client.api_key_retail });
            const agent = await retellClient.agent.retrieve(client.agent_id);
            const llmId = (agent.response_engine as any)?.llm_id;
            if (llmId) {
                const llm = await retellClient.llm.retrieve(llmId);
                debugInfo.after_tools_count = llm.general_tools?.length || 0;
                debugInfo.after_tool_names = (llm.general_tools || []).map((t: any) => t.name);
            }
        } catch (e) {
            // Ignore
        }

        return NextResponse.json({
            success: true,
            message: 'Tools registered successfully',
            debug: debugInfo
        });
    } catch (error: any) {
        console.error('Error registering tools:', error);
        return NextResponse.json({
            error: error.message || 'Failed to register tools',
            stack: error.stack?.split('\n').slice(0, 5)
        }, { status: 500 });
    }
}
