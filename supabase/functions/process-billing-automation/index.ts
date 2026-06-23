import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { orcamento_id } = await req.json()

    // 1. Validation
    const { data: orcamento, error: orcErr } = await supabaseClient
      .from('orcamentos')
      .select('*, projetos(*)')
      .eq('id', orcamento_id)
      .single()

    if (orcErr || !orcamento || !orcamento.projeto_id) {
      throw new Error('Projeto não encontrado para este orçamento.')
    }

    const { data: itens } = await supabaseClient
      .from('projeto_itens')
      .select('*')
      .eq('projeto_id', orcamento.projeto_id)

    if (itens) {
      const invalidos = itens.filter((i) => !i.validado)
      if (invalidos.length > 0) throw new Error('Existem itens não validados no projeto.')

      const zeroValue = itens.filter((i) => Number(i.preco_unitario) === 0)
      if (zeroValue.length > 0)
        throw new Error(
          `Orçamento ${orcamento.numero || orcamento_id} possui peças especiais pendentes de precificação`,
        )
    }

    // 2. Fiscal Protocol
    const valorBruto = Number(orcamento.valor_total) || 0
    const descontoGlobal = Number(orcamento.desconto_global) || 0
    const valorLiquido = valorBruto - descontoGlobal

    const numeroNota = Math.floor(Math.random() * 10000).toString()
    const pdfName = `NF${numeroNota}.pdf`

    // Mock PDF generation & upload
    const mockPdf = new Uint8Array([37, 80, 68, 70, 45, 10]) // %PDF-\n
    await supabaseClient.storage
      .from('notas_fiscais')
      .upload(pdfName, mockPdf, { contentType: 'application/pdf', upsert: true })

    const { data: publicUrl } = supabaseClient.storage.from('notas_fiscais').getPublicUrl(pdfName)

    await supabaseClient.from('notas_fiscais').insert({
      numero_nf: numeroNota,
      valor: valorLiquido,
      arquivo_url: publicUrl.publicUrl,
      data_emissao: new Date().toISOString(),
    })

    // 3. Banking Protocol
    const { data: parcelas } = await supabaseClient
      .from('projeto_parcelas')
      .select('*')
      .eq('projeto_id', orcamento.projeto_id)

    const boletosCriados = []
    if (parcelas) {
      for (const parcela of parcelas) {
        const { data: novoBoleto } = await supabaseClient
          .from('boletos')
          .insert({
            projeto_id: orcamento.projeto_id,
            parcela_id: parcela.id,
            empresa_id: orcamento.empresa_id,
            valor: parcela.valor,
            vencimento: parcela.data_vencimento,
            status: 'Pendente',
            tipo: 'Normal',
            nosso_numero: `10${Math.floor(Math.random() * 100000000)}`,
          })
          .select()
          .single()
        if (novoBoleto) boletosCriados.push(novoBoleto)
      }
    }

    // 5. RT (Commission) Logic
    let rtTotal = 0
    if (orcamento.arquiteto_id && itens) {
      const rtItens = itens.filter((i) => {
        const desc = (i.descricao || '').toLowerCase()
        if (desc.includes('fita') || desc.includes('fonte') || desc.includes('perfil')) return false
        if (desc.includes('luminária') || desc.includes('decorativa')) return true
        return false
      })
      rtTotal = rtItens.reduce((acc, i) => acc + (Number(i.subtotal) || 0) * 0.1, 0) // 10% mock
    }

    // 4. Notifications
    await supabaseClient.functions.invoke('sync-teams', {
      body: {
        message: `NF ${numeroNota} e Boletos gerados para o Orçamento ${orcamento.numero}`,
        to: 'Matheus',
        clientPackage: {
          nf: publicUrl.publicUrl,
          order: orcamento.numero,
        },
      },
    })

    return new Response(
      JSON.stringify({
        success: true,
        nf: publicUrl.publicUrl,
        boletos_gerados: boletosCriados.length,
        rt_calculado: rtTotal,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
