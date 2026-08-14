# O que este protótipo (v0) faz — e o que não faz

Documento honesto, no espírito da Seção 17 da especificação original (nunca prometer
mais do que existe), só que aqui é pra você mesma, não pra cliente.

## Faz

- Analisa um conteúdo por vez (link, descrição de vídeo/canal, ou texto colado) usando
  IA com saída estruturada, validada por schema.
- Aplica um motor de políticas determinístico *depois* da IA — a decisão final não sai
  direto do modelo. Falha do modelo, timeout ou JSON inválido sempre viram "revisar com
  você", nunca aprovação automática.
- Thresholds mais baixos (mais conservadores) especificamente para violência/ameaça,
  incentivo a comportamento perigoso e conteúdo assustador — por causa do contexto real
  dele.
- Mascara e-mail, telefone, CPF, CEP e @usuário antes de mandar qualquer coisa pro
  modelo.
- Isolamento por conta via RLS no Supabase (mesmo sendo uso de uma família só).
- Lista de Confiança simples, com revogação.

## NÃO faz (ainda)

- **Não lê nem intercepta o YouTube (ou qualquer app) em tempo real.** A proteção
  em tempo real no PC/celular/TV dele veio de fora do código: Modo Restrito travado na
  conta Google + Family Link + DNS familiar no roteador. Isso aqui é uma ferramenta pra
  você *analisar* algo específico quando tiver dúvida — não um bloqueador automático.
- Não tem Hotmart, planos, cobrança — de propósito, é só pra vocês.
- Não tem o "Modo Infantil" (portal curado com player embutido) da especificação
  original — não fazia sentido pra esse caso, já que ele precisa do YouTube de verdade
  pro canal dele.
- Não faz canonicalização de identificador de vídeo/canal (extrair o ID exato do
  YouTube) — a Lista de Confiança usa o link ou título como está. Um vídeo com nome
  parecido não herda a autorização automaticamente, mas a comparação ainda é simples.
- Não tem PIN/passkey separado — a autenticação é só o login da conta (e-mail/senha).
  Para uso de uma pessoa só, tudo bem por ora; não é o nível de segurança da spec
  comercial completa.
- Não fala com a criança, não modera comentário, não tem denúncia automática.

## Antes de considerar isso "pronto" pra proteção real

- Teste com casos reais (com moderação, sem expor ele a conteúdo de verdade) pra ver se
  os thresholds reforçados realmente pegam o que preocupa.
- `OPENAI_API_KEY` precisa estar configurada — sem ela, toda análise cai automaticamente
  em "revisar com você" (fallback seguro, mas também significa que a IA não está
  rodando de fato).
