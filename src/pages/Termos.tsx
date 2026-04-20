import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, HardHat } from "lucide-react";

export default function Termos() {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
              <HardHat className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-bold">EDUCA.I Academy</span>
          </div>
        </div>

        <Card className="p-6 md:p-8 space-y-6">
          <header>
            <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
            <p className="text-sm text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString("pt-BR")}
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-primary">1. Aceitação dos Termos</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Ao criar uma conta e utilizar a plataforma <strong className="text-foreground">EDUCA.I Academy</strong>, você
              declara ter lido, compreendido e aceito integralmente as regras descritas neste documento. Se não
              concordar com qualquer item, não utilize o serviço.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-primary">2. Reembolso por Indisponibilidade</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Caso o aplicativo fique <strong className="text-foreground">fora do ar</strong> ou
              <strong className="text-foreground"> deixe de funcionar de forma definitiva</strong>, o aluno terá direito
              ao reembolso do valor proporcional aos meses restantes do plano contratado.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              O reembolso será realizado em até <strong className="text-foreground">20 (vinte) dias corridos</strong> a
              contar da confirmação da indisponibilidade definitiva, mediante solicitação por e-mail ao suporte.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Manutenções programadas</strong> e instabilidades curtas (até 48h
              acumuladas no mês) <strong className="text-foreground">não geram direito a reembolso</strong>, pois fazem
              parte da operação normal de qualquer serviço online.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-primary">3. Conteúdo Gerado por IA</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Os resumos, simulados e respostas do <strong className="text-foreground">Professor Saraiva</strong> são
              gerados por inteligência artificial e servem como <strong className="text-foreground">apoio ao estudo</strong>.
              Eles <strong className="text-foreground">não substituem</strong> o texto oficial das Normas Regulamentadoras
              (NRs), legislação vigente, nem orientação técnica profissional.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              O aluno é responsável por sempre conferir a norma oficial publicada pelo órgão competente antes de aplicar
              qualquer informação em ambiente real de trabalho.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-primary">4. Uso Individual e Intransferível</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A conta é <strong className="text-foreground">pessoal e intransferível</strong>. O compartilhamento de
              login, senha ou código reserva com terceiros pode resultar em
              <strong className="text-foreground"> suspensão imediata da conta sem direito a reembolso</strong>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-primary">5. Conduta do Usuário</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">É proibido:</p>
            <ul className="text-sm leading-relaxed text-muted-foreground list-disc pl-5 space-y-1">
              <li>Ofender, ameaçar ou assediar outros alunos, professores ou a equipe.</li>
              <li>Enviar spam, publicidade ou conteúdo ilegal pelo chat.</li>
              <li>Realizar scraping, engenharia reversa ou tentar burlar limites de plano.</li>
              <li>Automatizar requisições para sobrecarregar o serviço.</li>
              <li>Usar a plataforma para qualquer fim ilícito.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-primary">6. Limites de Uso Justo</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              O Chat com Professor, a geração de resumos e a criação de simulados possuem
              <strong className="text-foreground"> limites razoáveis de uso</strong> para garantir desempenho a todos os
              alunos. Uso considerado abusivo pode ser temporariamente restringido.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-primary">7. Privacidade e LGPD</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Tratamos seus dados conforme a <strong className="text-foreground">Lei Geral de Proteção de Dados
              (LGPD)</strong>. O e-mail informado é utilizado exclusivamente para login, comunicação do serviço e
              cobrança. Não vendemos nem compartilhamos seus dados com terceiros para fins comerciais.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-primary">8. Cancelamento</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              O aluno pode solicitar o cancelamento da assinatura por e-mail ao suporte a qualquer momento. O valor já
              consumido (período já utilizado) <strong className="text-foreground">não é devolvido</strong>, exceto na
              hipótese da regra de indisponibilidade descrita no item 2.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-primary">9. Alterações dos Termos</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Estes Termos podem ser atualizados periodicamente. Mudanças relevantes exigirão um
              <strong className="text-foreground"> novo aceite</strong> dentro do aplicativo antes do próximo uso.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-primary">10. Contato e Foro</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Suporte e solicitações: <strong className="text-foreground">1lucasjob@gmail.com</strong>.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Fica eleito o foro da comarca do responsável pelo aplicativo para dirimir quaisquer questões oriundas
              destes Termos, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          <div className="pt-4 border-t border-border flex justify-end">
            <Link to="/login">
              <Button variant="outline">Voltar ao login</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
