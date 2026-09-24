// Modelo de usuária única (PLANO.md §13.3): o login não pede e-mail, só um PIN.
// Por baixo continua sendo Supabase Auth normal — esse e-mail é só um
// identificador técnico fixo, nunca mostrado na tela; o PIN é a senha real.
export const EMAIL_LOGIN = "acesso@clinica.local";
export const TAMANHO_PIN = 6;
