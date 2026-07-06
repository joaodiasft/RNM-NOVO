import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card } from "@/components/DashboardShell";
import { LABEL_PAPEL } from "@/lib/nav";
import { FormTrocarSenha } from "@/components/forms/FormTrocarSenha";
import { FormUploadFoto } from "@/components/forms/FormUploadFoto";

const TIPO_POR_PAPEL: Record<string, string> = {
  ALUNO: "aluno",
  PROFESSOR: "professor",
  RESPONSAVEL: "responsavel",
  ADMIN: "admin",
};

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { user } = session;

  return (
    <DashboardShell titulo="Meu Perfil" userName={user.nome} papel={user.papel}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Meus dados">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-400">Nome</dt>
              <dd className="font-medium text-gray-900">{user.nome}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Perfil</dt>
              <dd className="font-medium text-gray-900">{LABEL_PAPEL[user.papel]}</dd>
            </div>
            {user.codigo && (
              <div>
                <dt className="text-gray-400">Código de matrícula</dt>
                <dd className="font-medium text-gray-900">{user.codigo}</dd>
              </div>
            )}
            {user.email && (
              <div>
                <dt className="text-gray-400">E-mail</dt>
                <dd className="font-medium text-gray-900">{user.email}</dd>
              </div>
            )}
          </dl>
        </Card>

        <div className="space-y-4">
          <Card
            title="Alterar senha"
            descricao="A troca exige a senha atual e vale imediatamente"
          >
            <FormTrocarSenha />
          </Card>
          <Card title="Foto de perfil" descricao="JPG, PNG ou WebP de até 4 MB">
            <FormUploadFoto tipo={TIPO_POR_PAPEL[user.papel]} userId={user.id} />
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
