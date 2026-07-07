import { z } from "zod";

/**
 * Schemas de validação de entrada — TODA rota de API valida o body aqui.
 * Nunca confie em dados vindos do front.
 */

const cuid = z.string().cuid("Identificador inválido");
const hora = z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido (HH:MM)");

export const loginSchema = z.object({
  perfil: z.enum(["ALUNO", "RESPONSAVEL", "PROFESSOR", "ADMIN"]),
  identificador: z.string().trim().min(1).max(120),
  senha: z.string().min(1).max(2048), // ticket JWT do admin passa por aqui
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(120),
  senha: z.string().min(1).max(200),
});

export const adminVerifySchema = z.object({
  pendingToken: z.string().min(10).max(2048),
  codigo: z.string().regex(/^\d{6}$/, "Código deve ter 6 dígitos"),
});

const textoOpcional = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const novoAlunoSchema = z.object({
  // Obrigatórios
  nome: z.string().trim().min(2, "Nome muito curto").max(120),
  telefone: z.string().trim().min(8, "Telefone obrigatório").max(30),
  escola: z.string().trim().min(2, "Informe onde o aluno estuda").max(120),
  serie: z.string().trim().min(1, "Informe a série atual").max(40),
  dataNascimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento obrigatória"),
  turmaId: cuid, // curso 1 / turma 1
  planoId: cuid,
  // Opcionais
  email: z.string().trim().email("E-mail inválido").max(120).optional().or(z.literal("")),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").max(64).optional().or(z.literal("")),
  whatsapp: textoOpcional(30),
  instagram: textoOpcional(60),
  cpf: textoOpcional(20),
  rg: textoOpcional(20),
  endereco: textoOpcional(200),
  turma2Id: cuid.optional().or(z.literal("")), // curso 2 / turma 2
  plano2Id: cuid.optional().or(z.literal("")),
  // Responsável: novo cadastro ou vínculo com um já existente no sistema
  responsavel: z
    .discriminatedUnion("modo", [
      z.object({
        modo: z.literal("novo"),
        nome: z.string().trim().min(2).max(120),
        telefone: z.string().trim().min(8, "Telefone do responsável obrigatório").max(30),
        parentesco: textoOpcional(40),
        senha: z.string().min(6).max(64).optional().or(z.literal("")),
      }),
      z.object({
        modo: z.literal("existente"),
        responsavelId: cuid,
        parentesco: textoOpcional(40),
      }),
    ])
    .optional(),
});

export const esqueciSenhaSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(3, "Informe o código de matrícula")
    .max(30)
    .transform((v) => v.toUpperCase()),
});

export const criarMatriculaSchema = z.object({
  alunoId: cuid,
  turmaId: cuid,
  planoId: cuid,
});

export const promocaoSchema = z.object({
  titulo: z.string().trim().min(2).max(120),
  descricao: textoOpcional(500),
  cursoId: cuid.optional().or(z.literal("")),
  percentualDesconto: z.coerce.number().int().min(0).max(100).optional(),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de início obrigatória"),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de fim obrigatória"),
});

export const alternarPromocaoSchema = z.object({
  promocaoId: cuid,
  ativo: z.boolean(),
});

export const aulaTemaSchema = z.object({
  aulaId: cuid,
  conteudo: textoOpcional(300),
  materialUrl: z.string().trim().url("URL inválida").max(500).optional().or(z.literal("")),
});

const competenciasSchema = z
  .array(z.number().int().min(0).max(200))
  .length(5, "Informe as 5 competências (0 a 200)")
  .optional()
  .nullable();

export const registrarEntregaSchema = z.object({
  aulaId: cuid,
  alunoId: cuid,
  quantidadeEntregue: z.number().int().min(0).max(3),
});

export const lancarNotasSchema = z.object({
  entregaId: cuid,
  correcoes: z
    .array(
      z.object({
        numero: z.number().int().min(1).max(3),
        nota: z.number().min(0).max(1000).optional().nullable(), // professora
        notaSofia: z.number().min(0).max(1000).optional().nullable(),
        competencias: competenciasSchema,
      })
    )
    .min(1)
    .max(3),
});

export const aprovarEntregaSchema = z.object({
  entregaId: cuid,
  feedback: textoOpcional(1000),
});

export const marcarAvisoLidoSchema = z.object({
  avisoId: cuid,
});

export const alterarStatusUsuarioSchema = z.object({
  tipo: z.enum(["aluno", "professor"]),
  id: cuid,
  ativo: z.boolean(),
});

export const rematriculaCompletaSchema = z.object({
  // Confirmação de dados do aluno
  nome: z.string().trim().min(2).max(120),
  telefone: z.string().trim().min(8, "Telefone obrigatório").max(30),
  whatsapp: textoOpcional(30),
  instagram: textoOpcional(60),
  responsavelNome: textoOpcional(120),
  responsavelTelefone: textoOpcional(30),
  // Escolhas
  turmaId: cuid,
  turma2Id: cuid.optional().or(z.literal("")),
  planoId: cuid,
  formaPagamento: z.enum(["PIX", "DINHEIRO", "CARTAO", "OUTRO"]),
  alunoId: cuid.optional(), // responsável envia pelo filho
});

export const alunoPatchSchema = z.object({
  id: cuid,
  nome: z.string().trim().min(2).max(120).optional(),
  ativo: z.boolean().optional(),
  senha: z.string().min(6).max(64).optional(),
  fotoUrl: z.string().url().max(500).optional(),
});

export const STATUS_FREQUENCIA = [
  "PRESENTE",
  "FALTA",
  "FALTA_JUSTIFICADA",
  "REPOSICAO_DATA",
  "REPOSICAO_TURMA_DATA",
] as const;

export const frequenciaSchema = z.object({
  aulaId: cuid,
  alunoId: cuid,
  status: z.enum(STATUS_FREQUENCIA),
  reposicaoData: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional().nullable(),
  reposicaoTurmaId: cuid.optional().nullable(),
});

const correcaoSchema = z.object({
  numero: z.number().int().min(1).max(3),
  nota: z.number().min(0, "Nota mínima é 0").max(1000, "Nota máxima é 1000").optional().nullable(),
  comentario: z.string().trim().max(500).optional().nullable(),
});

export const redacaoPostSchema = z.object({
  aulaId: cuid,
  alunoId: cuid.optional(),
  quantidadeEntregue: z.number().int().min(0).max(3),
  correcoes: z.array(correcaoSchema).max(3).optional(),
});

export const redacaoPatchSchema = z.object({
  entregaId: cuid,
  correcoes: z.array(correcaoSchema).max(3).optional(),
});

export const acessoExternoSchema = z.object({
  alunoId: cuid,
  plataforma: z.string().trim().min(1).max(60),
  urlAcesso: z.string().trim().url("URL inválida").max(300),
  email: z.string().trim().min(1).max(120),
  senha: z.string().min(1).max(120),
});

export const avisoSchema = z
  .object({
    titulo: z.string().trim().min(1, "Título obrigatório").max(120),
    mensagem: z.string().trim().min(1, "Mensagem obrigatória").max(2000),
    publicoAlvo: z.enum(["TODOS", "CURSO", "TURMA", "ALUNO"]),
    cursoId: cuid.optional().or(z.literal("")),
    turmaId: cuid.optional().or(z.literal("")),
    alunoId: cuid.optional().or(z.literal("")),
  })
  .superRefine((val, ctx) => {
    if (val.publicoAlvo === "CURSO" && !val.cursoId) {
      ctx.addIssue({ code: "custom", message: "Selecione o curso do aviso" });
    }
    if (val.publicoAlvo === "TURMA" && !val.turmaId) {
      ctx.addIssue({ code: "custom", message: "Selecione a turma do aviso" });
    }
    if (val.publicoAlvo === "ALUNO" && !val.alunoId) {
      ctx.addIssue({ code: "custom", message: "Selecione o aluno do aviso" });
    }
  });

export const solicitarRematriculaSchema = z.object({
  alunoId: cuid.optional(),
  turmaId: cuid,
  planoId: cuid,
});

export const responderRematriculaSchema = z.object({
  solicitacaoId: cuid,
  status: z.enum(["APROVADA", "RECUSADA"]),
  observacao: z.string().trim().max(300).optional(),
});

export const confirmarPagamentoSchema = z.object({
  pagamentoId: cuid,
  formaPagamento: z.enum(["PIX", "DINHEIRO", "CARTAO", "OUTRO"]),
  observacao: z.string().trim().max(300).optional().or(z.literal("")),
});

export const novaTurmaSchema = z.object({
  nome: z.string().trim().min(1).max(40),
  cursoNome: z.enum(["REDACAO", "EXATAS", "MATEMATICA"]),
  diaSemana: z.enum([
    "SEGUNDA",
    "TERCA",
    "QUARTA",
    "QUINTA",
    "SEXTA",
    "SABADO",
    "DOMINGO",
  ]),
  horaInicio: hora,
  horaFim: hora,
  capacidade: z.coerce.number().int().min(1).max(200).optional(),
});

export const novoProfessorSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.string().trim().email("E-mail inválido").max(120),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").max(64).optional(),
  turmaId: cuid.optional().or(z.literal("")),
});

export const gerarModuloSchema = z.object({
  turmaId: cuid,
  mesReferencia: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

export const trocarSenhaSchema = z.object({
  senhaAtual: z.string().min(1).max(200),
  novaSenha: z
    .string()
    .min(8, "A nova senha deve ter no mínimo 8 caracteres")
    .max(64)
    .regex(/[a-zA-Z]/, "A nova senha precisa de pelo menos uma letra")
    .regex(/\d/, "A nova senha precisa de pelo menos um número"),
});

export const premiarAlunoSchema = z.object({
  alunoId: cuid,
  titulo: z.string().trim().min(2, "Título muito curto").max(80),
  descricao: textoOpcional(300),
  icone: z.string().trim().max(8).optional().or(z.literal("")),
});

export const removerPremiacaoSchema = z.object({
  premiacaoId: cuid,
});

export const feedbackCursoSchema = z.object({
  cursoId: cuid,
  nota: z.number().int().min(1, "Dê de 1 a 5 estrelas").max(5),
  comentario: textoOpcional(600),
});

/** Valida `body` com o schema; retorna dados tipados ou a mensagem do primeiro erro. */
export function validar<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown
): { data: z.infer<T>; erro: null } | { data: null; erro: string } {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { data: null, erro: issue?.message || "Dados inválidos" };
  }
  return { data: parsed.data, erro: null };
}
