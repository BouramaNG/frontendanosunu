export type EchoInstance = {
  private: (channel: string) => {
    listen: (event: string, callback: (data: any) => void) => any;
  };
};

export async function getEcho(): Promise<EchoInstance | null> {
  const globalObject = window as unknown as { Echo?: EchoInstance };

  if (globalObject.Echo) {
    return globalObject.Echo;
  }

  try {
    const { default: Echo } = await import('laravel-echo');
    (window as any).Pusher = (await import('pusher-js')).default;

    const echoInstance = new Echo({
      broadcaster: 'pusher',
      key: import.meta.env.VITE_PUSHER_KEY,
      cluster: import.meta.env.VITE_PUSHER_CLUSTER ?? 'eu',
      forceTLS: true,
      authEndpoint: `${import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') ?? ''}`,
          Accept: 'application/json',
        },
      },
    });

    globalObject.Echo = echoInstance;
    return echoInstance;
  } catch (error) {
    return null;
  }
}
