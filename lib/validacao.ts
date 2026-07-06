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

export const novoAlunoSchema = z.object({
  nome: z.string().trim().min(2, "Nome muito curto").max(120),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").max(64).optional(),
  dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  turmaId: cuid.optional(),
  planoId: cuid.optional(),
  responsavel: z
    .object({
      nome: z.string().trim().min(2).max(120),
      telefone: z.string().trim().max(30).optional().or(z.literal("")),
      parentesco: z.string().trim().max(40).optional().or(z.literal("")),
    })
    .optional(),
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
