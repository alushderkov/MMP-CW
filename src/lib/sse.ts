type Client = {
  userId: string;
  send: (payload: string) => void;
};

const clients = new Map<string, Set<Client>>();

export function subscribe(userId: string, send: (payload: string) => void) {
  const client: Client = { userId, send };
  const set = clients.get(userId) || new Set<Client>();
  set.add(client);
  clients.set(userId, set);
  return () => {
    set.delete(client);
    if (set.size === 0) {
      clients.delete(userId);
    }
  };
}

export function pushEvent(userId: string, data: unknown) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  const set = clients.get(userId);
  if (!set) {
    return;
  }
  for (const client of set) {
    try {
      client.send(payload);
    } catch {
      set.delete(client);
    }
  }
}
