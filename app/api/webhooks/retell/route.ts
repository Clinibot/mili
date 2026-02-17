import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Missing token' }, { status: 401 });
        }

        // Verify token exists (optional: cache this check for performance if high volume)
        const { data: client, error } = await supabase
            .from('clients')
            .select('id')
            .eq('webhook_token', token)
            .single();

        if (error || !client) {
            console.error('Invalid token:', token);
            return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
        }

        const body = await req.json();
        const { event, call } = body;

        console.log(`Webhook [${event}] received for client:`, client.id, call?.call_id);

        // Procesamos 'call_analyzed' y 'call_transferred'
        if (event !== 'call_analyzed' && event !== 'call_transferred') {
            return NextResponse.json({ received: true, message: 'Event ignored' });
        }

        if (!call) {
            return NextResponse.json({ error: 'Missing call object' }, { status: 400 });
        }

        const {
            call_id,
            agent_id,
            duration_ms,
            start_timestamp,
            end_timestamp,
            transcript,
            recording_url,
            from_number,
            to_number,
            call_analysis,
            direction
        } = call;

        // 1. Manejar el evento 'call_transferred' (Intento de transferencia)
        if (event === 'call_transferred') {
            const { error: upsertError } = await supabase
                .from('calls')
                .upsert({
                    client_id: client.id,
                    call_id,
                    agent_id,
                    call_type: 'retell',
                    direction,
                    start_timestamp,
                    from_number,
                    to_number,
                    transfer_attempted: true,
                    // Intentamos sacar el destino si está disponible en algún campo
                    transfer_destination: body.transfer_destination || null
                }, { onConflict: 'call_id' });

            if (upsertError) {
                console.error('Error upserting transfer event:', upsertError);
                return NextResponse.json({ error: 'Failed to record transfer' }, { status: 500 });
            }
            return NextResponse.json({ received: true, message: 'Transfer recorded' });
        }

        // 2. Manejar 'call_analyzed' (Finalización y cobro)
        // Evitar procesar si ya está facturada (aunque con upsert ahora es más flexible)
        const { data: existingCall } = await supabase
            .from('calls')
            .select('id, call_status')
            .eq('call_id', call_id)
            .maybeSingle();

        if (existingCall?.call_status === 'completed') {
            return NextResponse.json({ received: true, message: 'Call already processed' });
        }

        // Calcular costes
        const durationSeconds = Math.floor(duration_ms / 1000);
        const billableMinutes = Math.ceil(durationSeconds / 60) || 1;
        const costPerMinute = 0.16;
        const totalCost = billableMinutes * costPerMinute;

        try {
            // Obtener balance actual
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('balance, name')
                .eq('id', client.id)
                .single();

            if (clientError || !clientData) throw new Error('Client not found during billing');

            const currentBalance = clientData.balance || 0;
            const newBalance = currentBalance - totalCost;

            // Actualizar balance
            await supabase
                .from('clients')
                .update({ balance: newBalance })
                .eq('id', client.id);

            // Upsert de la llamada con los datos finales
            const { error: insertError } = await supabase
                .from('calls')
                .upsert({
                    client_id: client.id,
                    call_id,
                    agent_id,
                    call_type: 'retell',
                    direction,
                    call_status: 'completed',
                    start_timestamp,
                    end_timestamp,
                    duration_seconds: durationSeconds,
                    transcript,
                    recording_url,
                    from_number,
                    to_number,
                    call_summary: call_analysis?.call_summary,
                    user_sentiment: call_analysis?.user_sentiment || 'Neutral',
                    call_successful: call_analysis?.call_successful || false,
                    in_voicemail: call_analysis?.in_voicemail || false,
                    custom_analysis_data: call_analysis?.custom_analysis_data || {},
                    // Si se analizó y fue exitosa, y marcamos intento antes, confirmamos éxito
                    transfer_successful: call_analysis?.call_successful && (existingCall as any)?.transfer_attempted
                }, { onConflict: 'call_id' });

            if (insertError) throw insertError;

            // Registrar transacción
            await supabase
                .from('transactions')
                .insert({
                    client_id: client.id,
                    type: 'deduction',
                    amount: totalCost,
                    balance_before: currentBalance,
                    balance_after: newBalance,
                    description: `Llamada IA (${billableMinutes} min): ${call_id}`,
                    metadata: { call_id, duration_seconds: durationSeconds, event_type: event }
                });

            console.log(`✅ Call ${call_id} processed. Cost: ${totalCost}€ deducted.`);
            return NextResponse.json({ received: true, billedAmount: totalCost });

        } catch (billingError: any) {
            console.error('❌ Error in billing process:', billingError);
            return NextResponse.json({ error: 'Billing process failed', details: billingError.message }, { status: 500 });
        }

    } catch (e) {
        console.error('Webhook error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
