// Helpers client-side de Web Push. Nunca importar em Server Components —
// usa `navigator`/`window`, só funciona chamado de dentro de Client Components.

export function ehIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function ehStandalone(): boolean {
  const standaloneIOS = (navigator as unknown as { standalone?: boolean }).standalone;
  return window.matchMedia("(display-mode: standalone)").matches || standaloneIOS === true;
}

export function suportaPush(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window;
}

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0))) as BufferSource;
}

export async function buscarInscricaoAtual(): Promise<PushSubscription | null> {
  if (!suportaPush()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export type MotivoFalhaAtivacao =
  | "sem_suporte"
  | "ios_nao_instalado"
  | "permissao_negada"
  | "erro";

export async function inscreverPush(): Promise<
  { ok: true; subscription: PushSubscription } | { ok: false; motivo: MotivoFalhaAtivacao }
> {
  if (!suportaPush()) return { ok: false, motivo: "sem_suporte" };
  if (ehIOS() && !ehStandalone()) return { ok: false, motivo: "ios_nao_instalado" };

  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") return { ok: false, motivo: "permissao_negada" };

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    });
    return { ok: true, subscription };
  } catch {
    return { ok: false, motivo: "erro" };
  }
}

export function paraJSON(subscription: PushSubscription) {
  const json = subscription.toJSON();
  return {
    endpoint: json.endpoint!,
    keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
  };
}
