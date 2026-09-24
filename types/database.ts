export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          atualizado_em: string
          cliente_id: string
          criado_em: string
          desconto_centavos: number
          fim: string
          id: string
          inicio: string
          notas_sessao: string | null
          observacoes: string | null
          pacote_item_id: string | null
          preco_centavos: number
          servico_id: string
          status: Database["public"]["Enums"]["status_agendamento"]
          valor_cobrado_centavos: number | null
        }
        Insert: {
          atualizado_em?: string
          cliente_id: string
          criado_em?: string
          desconto_centavos?: number
          fim: string
          id?: string
          inicio: string
          notas_sessao?: string | null
          observacoes?: string | null
          pacote_item_id?: string | null
          preco_centavos: number
          servico_id: string
          status?: Database["public"]["Enums"]["status_agendamento"]
          valor_cobrado_centavos?: number | null
        }
        Update: {
          atualizado_em?: string
          cliente_id?: string
          criado_em?: string
          desconto_centavos?: number
          fim?: string
          id?: string
          inicio?: string
          notas_sessao?: string | null
          observacoes?: string | null
          pacote_item_id?: string | null
          preco_centavos?: number
          servico_id?: string
          status?: Database["public"]["Enums"]["status_agendamento"]
          valor_cobrado_centavos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_saldo_cliente"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "agendamentos_pacote_item_id_fkey"
            columns: ["pacote_item_id"]
            isOneToOne: false
            referencedRelation: "pacote_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_pacote_item_id_fkey"
            columns: ["pacote_item_id"]
            isOneToOne: false
            referencedRelation: "vw_creditos_pacote"
            referencedColumns: ["pacote_item_id"]
          },
          {
            foreignKeyName: "agendamentos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "vw_creditos_pacote"
            referencedColumns: ["servico_id"]
          },
        ]
      }
      analises_ia: {
        Row: {
          concluida_em: string | null
          conversa_id: string
          custo_centavos_usd: number | null
          erro: string | null
          id: string
          iniciada_em: string
          modelo: string
          resultado: Json | null
          status: string
          tokens_cache_read: number | null
          tokens_entrada: number | null
          tokens_saida: number | null
          versao_prompt: string
        }
        Insert: {
          concluida_em?: string | null
          conversa_id: string
          custo_centavos_usd?: number | null
          erro?: string | null
          id?: string
          iniciada_em?: string
          modelo: string
          resultado?: Json | null
          status?: string
          tokens_cache_read?: number | null
          tokens_entrada?: number | null
          tokens_saida?: number | null
          versao_prompt: string
        }
        Update: {
          concluida_em?: string | null
          conversa_id?: string
          custo_centavos_usd?: number | null
          erro?: string | null
          id?: string
          iniciada_em?: string
          modelo?: string
          resultado?: Json | null
          status?: string
          tokens_cache_read?: number | null
          tokens_entrada?: number | null
          tokens_saida?: number | null
          versao_prompt?: string
        }
        Relationships: [
          {
            foreignKeyName: "analises_ia_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas_whatsapp"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria: {
        Row: {
          criado_em: string
          dados_antes: Json | null
          dados_depois: Json | null
          id: number
          operacao: string
          registro_id: string | null
          tabela: string
          user_id: string | null
        }
        Insert: {
          criado_em?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          id?: number
          operacao: string
          registro_id?: string | null
          tabela: string
          user_id?: string | null
        }
        Update: {
          criado_em?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          id?: number
          operacao?: string
          registro_id?: string | null
          tabela?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bloqueios: {
        Row: {
          criado_em: string
          fim: string
          id: string
          inicio: string
          titulo: string
        }
        Insert: {
          criado_em?: string
          fim: string
          id?: string
          inicio: string
          titulo: string
        }
        Update: {
          criado_em?: string
          fim?: string
          id?: string
          inicio?: string
          titulo?: string
        }
        Relationships: []
      }
      categorias_despesa: {
        Row: {
          cor: string
          icone: string | null
          id: string
          nome: string
        }
        Insert: {
          cor?: string
          icone?: string | null
          id?: string
          nome: string
        }
        Update: {
          cor?: string
          icone?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          alergias: string | null
          arquivado_em: string | null
          atualizado_em: string
          como_conheceu: string | null
          criado_em: string
          data_nascimento: string | null
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          preferencias: string | null
          restricoes_saude: string | null
          tags: string[]
          telefone: string | null
        }
        Insert: {
          alergias?: string | null
          arquivado_em?: string | null
          atualizado_em?: string
          como_conheceu?: string | null
          criado_em?: string
          data_nascimento?: string | null
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          preferencias?: string | null
          restricoes_saude?: string | null
          tags?: string[]
          telefone?: string | null
        }
        Update: {
          alergias?: string | null
          arquivado_em?: string | null
          atualizado_em?: string
          como_conheceu?: string | null
          criado_em?: string
          data_nascimento?: string | null
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          preferencias?: string | null
          restricoes_saude?: string | null
          tags?: string[]
          telefone?: string | null
        }
        Relationships: []
      }
      cobrancas: {
        Row: {
          agendamento_id: string | null
          atualizado_em: string
          cliente_id: string
          criado_em: string
          descricao: string
          id: string
          origem_tipo: Database["public"]["Enums"]["origem_cobranca"]
          pacote_id: string | null
          status: Database["public"]["Enums"]["status_cobranca"]
          valor_centavos: number
          vencimento: string | null
        }
        Insert: {
          agendamento_id?: string | null
          atualizado_em?: string
          cliente_id: string
          criado_em?: string
          descricao: string
          id?: string
          origem_tipo: Database["public"]["Enums"]["origem_cobranca"]
          pacote_id?: string | null
          status?: Database["public"]["Enums"]["status_cobranca"]
          valor_centavos: number
          vencimento?: string | null
        }
        Update: {
          agendamento_id?: string | null
          atualizado_em?: string
          cliente_id?: string
          criado_em?: string
          descricao?: string
          id?: string
          origem_tipo?: Database["public"]["Enums"]["origem_cobranca"]
          pacote_id?: string | null
          status?: Database["public"]["Enums"]["status_cobranca"]
          valor_centavos?: number
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cobrancas_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobrancas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobrancas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_saldo_cliente"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "cobrancas_pacote_id_fkey"
            columns: ["pacote_id"]
            isOneToOne: false
            referencedRelation: "pacotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobrancas_pacote_id_fkey"
            columns: ["pacote_id"]
            isOneToOne: false
            referencedRelation: "vw_creditos_pacote"
            referencedColumns: ["pacote_id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          chave: string
          valor: Json
        }
        Insert: {
          chave: string
          valor: Json
        }
        Update: {
          chave?: string
          valor?: Json
        }
        Relationships: []
      }
      conversas_whatsapp: {
        Row: {
          arquivo_path: string | null
          cliente_id: string | null
          conteudo_bruto: string | null
          criado_em: string
          id: string
          nome_contato: string | null
          origem: string
          periodo_fim: string | null
          periodo_inicio: string | null
          telefone: string | null
          total_mensagens: number | null
        }
        Insert: {
          arquivo_path?: string | null
          cliente_id?: string | null
          conteudo_bruto?: string | null
          criado_em?: string
          id?: string
          nome_contato?: string | null
          origem: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          telefone?: string | null
          total_mensagens?: number | null
        }
        Update: {
          arquivo_path?: string | null
          cliente_id?: string | null
          conteudo_bruto?: string | null
          criado_em?: string
          id?: string
          nome_contato?: string | null
          origem?: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          telefone?: string | null
          total_mensagens?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversas_whatsapp_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_whatsapp_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_saldo_cliente"
            referencedColumns: ["cliente_id"]
          },
        ]
      }
      despesas: {
        Row: {
          ativa: boolean
          atualizado_em: string
          categoria_id: string | null
          criado_em: string
          data_despesa: string | null
          descricao: string
          dia_vencimento: number | null
          id: string
          recorrencia: Database["public"]["Enums"]["recorrencia"]
          tipo: Database["public"]["Enums"]["tipo_despesa"]
          valor_centavos: number
        }
        Insert: {
          ativa?: boolean
          atualizado_em?: string
          categoria_id?: string | null
          criado_em?: string
          data_despesa?: string | null
          descricao: string
          dia_vencimento?: number | null
          id?: string
          recorrencia?: Database["public"]["Enums"]["recorrencia"]
          tipo: Database["public"]["Enums"]["tipo_despesa"]
          valor_centavos: number
        }
        Update: {
          ativa?: boolean
          atualizado_em?: string
          categoria_id?: string | null
          criado_em?: string
          data_despesa?: string | null
          descricao?: string
          dia_vencimento?: number | null
          id?: string
          recorrencia?: Database["public"]["Enums"]["recorrencia"]
          tipo?: Database["public"]["Enums"]["tipo_despesa"]
          valor_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_despesa"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas_ocorrencias: {
        Row: {
          competencia: string
          despesa_id: string
          id: string
          metodo: Database["public"]["Enums"]["metodo_pagamento"] | null
          pago: boolean
          pago_em: string | null
          valor_centavos: number
          vencimento: string
        }
        Insert: {
          competencia: string
          despesa_id: string
          id?: string
          metodo?: Database["public"]["Enums"]["metodo_pagamento"] | null
          pago?: boolean
          pago_em?: string | null
          valor_centavos: number
          vencimento: string
        }
        Update: {
          competencia?: string
          despesa_id?: string
          id?: string
          metodo?: Database["public"]["Enums"]["metodo_pagamento"] | null
          pago?: boolean
          pago_em?: string | null
          valor_centavos?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "despesas_ocorrencias_despesa_id_fkey"
            columns: ["despesa_id"]
            isOneToOne: false
            referencedRelation: "despesas"
            referencedColumns: ["id"]
          },
        ]
      }
      horarios_atendimento: {
        Row: {
          ativo: boolean
          dia_semana: number
          hora_fim: string
          hora_inicio: string
          id: string
        }
        Insert: {
          ativo?: boolean
          dia_semana: number
          hora_fim: string
          hora_inicio: string
          id?: string
        }
        Update: {
          ativo?: boolean
          dia_semana?: number
          hora_fim?: string
          hora_inicio?: string
          id?: string
        }
        Relationships: []
      }
      notificacoes: {
        Row: {
          agendada_para: string
          chave_unica: string | null
          corpo: string
          enviada_em: string | null
          erro: string | null
          id: string
          lida_em: string | null
          tipo: string
          titulo: string
          url_destino: string | null
          user_id: string
        }
        Insert: {
          agendada_para: string
          chave_unica?: string | null
          corpo: string
          enviada_em?: string | null
          erro?: string | null
          id?: string
          lida_em?: string | null
          tipo: string
          titulo: string
          url_destino?: string | null
          user_id: string
        }
        Update: {
          agendada_para?: string
          chave_unica?: string | null
          corpo?: string
          enviada_em?: string | null
          erro?: string | null
          id?: string
          lida_em?: string | null
          tipo?: string
          titulo?: string
          url_destino?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pacote_itens: {
        Row: {
          id: string
          pacote_id: string
          preco_unitario_centavos: number
          preco_unitario_com_desconto_centavos: number
          quantidade: number
          quantidade_usada: number
          servico_id: string
        }
        Insert: {
          id?: string
          pacote_id: string
          preco_unitario_centavos: number
          preco_unitario_com_desconto_centavos: number
          quantidade: number
          quantidade_usada?: number
          servico_id: string
        }
        Update: {
          id?: string
          pacote_id?: string
          preco_unitario_centavos?: number
          preco_unitario_com_desconto_centavos?: number
          quantidade?: number
          quantidade_usada?: number
          servico_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacote_itens_pacote_id_fkey"
            columns: ["pacote_id"]
            isOneToOne: false
            referencedRelation: "pacotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacote_itens_pacote_id_fkey"
            columns: ["pacote_id"]
            isOneToOne: false
            referencedRelation: "vw_creditos_pacote"
            referencedColumns: ["pacote_id"]
          },
          {
            foreignKeyName: "pacote_itens_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacote_itens_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "vw_creditos_pacote"
            referencedColumns: ["servico_id"]
          },
        ]
      }
      pacote_modelos: {
        Row: {
          criado_em: string
          desconto_tipo: Database["public"]["Enums"]["tipo_desconto"]
          desconto_valor: number
          id: string
          itens: Json
          nome: string
        }
        Insert: {
          criado_em?: string
          desconto_tipo: Database["public"]["Enums"]["tipo_desconto"]
          desconto_valor: number
          id?: string
          itens: Json
          nome: string
        }
        Update: {
          criado_em?: string
          desconto_tipo?: Database["public"]["Enums"]["tipo_desconto"]
          desconto_valor?: number
          id?: string
          itens?: Json
          nome?: string
        }
        Relationships: []
      }
      pacotes: {
        Row: {
          atualizado_em: string
          cliente_id: string
          criado_em: string
          desconto_tipo: Database["public"]["Enums"]["tipo_desconto"]
          desconto_valor: number
          id: string
          nome: string
          observacoes: string | null
          status: Database["public"]["Enums"]["status_pacote"]
          validade: string | null
          valor_bruto_centavos: number
          valor_final_centavos: number
        }
        Insert: {
          atualizado_em?: string
          cliente_id: string
          criado_em?: string
          desconto_tipo?: Database["public"]["Enums"]["tipo_desconto"]
          desconto_valor?: number
          id?: string
          nome: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_pacote"]
          validade?: string | null
          valor_bruto_centavos: number
          valor_final_centavos: number
        }
        Update: {
          atualizado_em?: string
          cliente_id?: string
          criado_em?: string
          desconto_tipo?: Database["public"]["Enums"]["tipo_desconto"]
          desconto_valor?: number
          id?: string
          nome?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_pacote"]
          validade?: string | null
          valor_bruto_centavos?: number
          valor_final_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "pacotes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacotes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_saldo_cliente"
            referencedColumns: ["cliente_id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          cobranca_id: string
          criado_em: string
          id: string
          metodo: Database["public"]["Enums"]["metodo_pagamento"]
          observacao: string | null
          pago_em: string
          valor_centavos: number
        }
        Insert: {
          cobranca_id: string
          criado_em?: string
          id?: string
          metodo: Database["public"]["Enums"]["metodo_pagamento"]
          observacao?: string | null
          pago_em?: string
          valor_centavos: number
        }
        Update: {
          cobranca_id?: string
          criado_em?: string
          id?: string
          metodo?: Database["public"]["Enums"]["metodo_pagamento"]
          observacao?: string | null
          pago_em?: string
          valor_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_cobranca_id_fkey"
            columns: ["cobranca_id"]
            isOneToOne: false
            referencedRelation: "cobrancas"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          criado_em: string
          endpoint: string
          id: string
          p256dh: string
          ultimo_uso: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          criado_em?: string
          endpoint: string
          id?: string
          p256dh: string
          ultimo_uso?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          criado_em?: string
          endpoint?: string
          id?: string
          p256dh?: string
          ultimo_uso?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      servicos: {
        Row: {
          ativo: boolean
          atualizado_em: string
          cor: string
          criado_em: string
          descricao: string | null
          duracao_min: number
          id: string
          nome: string
          ordem: number
          preco_centavos: number
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          cor?: string
          criado_em?: string
          descricao?: string | null
          duracao_min: number
          id?: string
          nome: string
          ordem?: number
          preco_centavos: number
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          cor?: string
          criado_em?: string
          descricao?: string | null
          duracao_min?: number
          id?: string
          nome?: string
          ordem?: number
          preco_centavos?: number
        }
        Relationships: []
      }
      servicos_historico_preco: {
        Row: {
          alterado_em: string
          id: string
          preco_anterior: number
          preco_novo: number
          servico_id: string
        }
        Insert: {
          alterado_em?: string
          id?: string
          preco_anterior: number
          preco_novo: number
          servico_id: string
        }
        Update: {
          alterado_em?: string
          id?: string
          preco_anterior?: number
          preco_novo?: number
          servico_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicos_historico_preco_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_historico_preco_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "vw_creditos_pacote"
            referencedColumns: ["servico_id"]
          },
        ]
      }
      sugestoes_ia: {
        Row: {
          analise_id: string
          aplicada_em: string | null
          cliente_id: string | null
          confianca: number
          criado_em: string
          evidencia: string
          id: string
          payload: Json
          registro_id: string | null
          status: Database["public"]["Enums"]["status_sugestao"]
          tipo: string
        }
        Insert: {
          analise_id: string
          aplicada_em?: string | null
          cliente_id?: string | null
          confianca: number
          criado_em?: string
          evidencia: string
          id?: string
          payload: Json
          registro_id?: string | null
          status?: Database["public"]["Enums"]["status_sugestao"]
          tipo: string
        }
        Update: {
          analise_id?: string
          aplicada_em?: string | null
          cliente_id?: string | null
          confianca?: number
          criado_em?: string
          evidencia?: string
          id?: string
          payload?: Json
          registro_id?: string | null
          status?: Database["public"]["Enums"]["status_sugestao"]
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "sugestoes_ia_analise_id_fkey"
            columns: ["analise_id"]
            isOneToOne: false
            referencedRelation: "analises_ia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sugestoes_ia_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sugestoes_ia_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_saldo_cliente"
            referencedColumns: ["cliente_id"]
          },
        ]
      }
    }
    Views: {
      vw_creditos_pacote: {
        Row: {
          cliente_id: string | null
          cliente_nome: string | null
          disponivel: number | null
          pacote_id: string | null
          pacote_item_id: string | null
          quantidade: number | null
          quantidade_usada: number | null
          servico_id: string | null
          servico_nome: string | null
          validade: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pacotes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacotes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_saldo_cliente"
            referencedColumns: ["cliente_id"]
          },
        ]
      }
      vw_fluxo_caixa_mensal: {
        Row: {
          entradas: number | null
          mes: string | null
          resultado: number | null
          saidas: number | null
        }
        Relationships: []
      }
      vw_saldo_cliente: {
        Row: {
          cliente_id: string | null
          cobrancas_abertas: number | null
          nome: string | null
          saldo_devedor: number | null
          telefone: string | null
          total_cobrado: number | null
          total_pago: number | null
          vencimento_mais_antigo: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      metodo_pagamento:
        | "pix"
        | "dinheiro"
        | "cartao_credito"
        | "cartao_debito"
        | "transferencia"
        | "outro"
      origem_cobranca: "agendamento" | "pacote" | "avulso"
      recorrencia:
        | "nenhuma"
        | "semanal"
        | "mensal"
        | "bimestral"
        | "trimestral"
        | "anual"
      status_agendamento:
        | "agendado"
        | "confirmado"
        | "concluido"
        | "cancelado"
        | "faltou"
      status_cobranca: "aberta" | "parcial" | "paga" | "cancelada"
      status_pacote: "ativo" | "concluido" | "expirado" | "cancelado"
      status_sugestao: "pendente" | "aprovada" | "rejeitada" | "aplicada"
      tipo_desconto: "percentual" | "valor"
      tipo_despesa: "fixa" | "ocasional"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      metodo_pagamento: [
        "pix",
        "dinheiro",
        "cartao_credito",
        "cartao_debito",
        "transferencia",
        "outro",
      ],
      origem_cobranca: ["agendamento", "pacote", "avulso"],
      recorrencia: [
        "nenhuma",
        "semanal",
        "mensal",
        "bimestral",
        "trimestral",
        "anual",
      ],
      status_agendamento: [
        "agendado",
        "confirmado",
        "concluido",
        "cancelado",
        "faltou",
      ],
      status_cobranca: ["aberta", "parcial", "paga", "cancelada"],
      status_pacote: ["ativo", "concluido", "expirado", "cancelado"],
      status_sugestao: ["pendente", "aprovada", "rejeitada", "aplicada"],
      tipo_desconto: ["percentual", "valor"],
      tipo_despesa: ["fixa", "ocasional"],
    },
  },
} as const

