export const copy = {
  es: { title:'Como se opera, no como se entrevista.', lead:'Estima capacidad, elige un trade-off, apaga un incidente.', start:'Entrar a un incidente', cases:'Casos', nums:'Números', fire:'Fuego', home:'Inicio', sub:'System design de producción', casesLead:'Clásicos de entrevista, criterio de producción.', done:'Hecho', next:'Siguiente', well:'Bien. ', no:'No. ', footer:'ProdLab · sin tracking', dau:'Usuarios / día', rpu:'Requests / user / día', peak:'Pico vs promedio', verdict:'Lectura' },
  en: { title:'How you operate it, not how you interview it.', lead:'Estimate capacity, pick a trade-off, put out a fire.', start:'Jump into an incident', cases:'Cases', nums:'Numbers', fire:'Fire', home:'Home', sub:'Production system design', casesLead:'Interview classics, production criteria.', done:'Done', next:'Next', well:'Yes. ', no:'No. ', footer:'ProdLab · no tracking', dau:'Users / day', rpu:'Requests / user / day', peak:'Peak vs average', verdict:'Read' },
} as const;

export const principles = {
  es: [['p99, no el promedio','El usuario siente la cola.','El average esconde un shard enfermo.'],['Stateless','Estado en Redis, DB o el cliente.','Lock en memoria: el rollout parte el job.'],['Idempotencia','Retries existen. Usa Idempotency-Key.','Exactly-once del broker no cubre el email.'],['Backpressure','Timeout, breaker, cola acotada, 429.','Retry sin jitter = thundering herd.']],
  en: [['p99, not the average','Users feel the tail.','Averages hide a sick shard.'],['Stateless','State in Redis, DB, or the client.','In-memory lock: rollout splits the job.'],['Idempotency','Retries exist. Use an Idempotency-Key.','Broker exactly-once does not cover email.'],['Backpressure','Timeout, breaker, bounded queue, 429.','Retry without jitter = thundering herd.']],
};

const S = (qes:string,qen:string,arch:string,snip:string,okEs:string,okEn:string,whyEs:string,whyEn:string,badEs:string,badEn:string,whyBEs:string,whyBEn:string) => ({
  q:{es:qes,en:qen}, arch, snip,
  opts:[
    {ok:true,t:{es:okEs,en:okEn},why:{es:whyEs,en:whyEn}},
    {ok:false,t:{es:badEs,en:badEn},why:{es:whyBEs,en:whyBEn}},
  ],
});

export const cases = {
  short: { es:'URL shortener', en:'URL shortener', blurb:{es:'Redirect caliente.',en:'Hot redirect.'}, steps:[S('¿Qué es no negociable?','What is non-negotiable?','CDN → App → Redis → DB','GET /:code → cache ?? db\n302','Redirect < 20ms p99','Redirect < 20ms p99','El GET es el producto.','The GET is the product.','Contador en el 302','Counter in the 302','Mata el p99.','Kills p99.')] },
  rate: { es:'Rate limiter', en:'Rate limiter', blurb:{es:'El clásico.',en:'The classic.'}, steps:[S('¿Dónde vive el límite?','Where does the limit live?','Gateway → Redis','n = INCR key\nif n > max: 429','Gateway + Redis','Gateway + Redis','Un cupo para todos los pods.','One quota across pods.','Contador por pod','Per-pod counter','N pods = N cupos.','N pods = N quotas.')] },
  feed: { es:'News feed', en:'News feed', blurb:{es:'Fan-out.',en:'Fan-out.'}, steps:[S('¿Fan-out?','Fan-out?','write → queue → inboxes','if followers < N: write else read','Write normales, read celebrity','Write normal, read celebrity','Evitas un DDoS interno.','Avoid an internal DDoS.','Siempre on write','Always on write','La cola explota.','The queue explodes.')] },
  ids: { es:'Unique IDs', en:'Unique IDs', blurb:{es:'Snowflake.',en:'Snowflake.'}, steps:[S('IDs multi-región','Multi-region IDs','ts + worker + seq','id = (ts<<22)|(worker<<12)|seq','Snowflake / ULID','Snowflake / ULID','Local y ordenable.','Local and sortable.','AUTO_INCREMENT','AUTO_INCREMENT','Un writer.','One writer.')] },
  tickets: { es:'Ticket booking', en:'Ticket booking', blurb:{es:'Último asiento.',en:'Last seat.'}, steps:[S('Dos users, un asiento','Two users, one seat','hold + TTL','UPDATE WHERE hold IS NULL','Hold atómico + TTL','Atomic hold + TTL','Un ganador.','One winner.','Check-then-act','Check-then-act','Doble venta.','Double sell.')] },
  video: { es:'Video upload', en:'Video upload', blurb:{es:'800MB.',en:'800MB.'}, steps:[S('El user sube 800MB','User uploads 800MB','presigned PUT → queue','POST /uploads → URL','Object storage + async','Object storage + async','La API no es un pipe.','The API is not a pipe.','ffmpeg en el request','ffmpeg in the request','Timeout.','Timeout.')] },
  notif: { es:'Notificaciones', en:'Notifications', blurb:{es:'Outbox.',en:'Outbox.'}, steps:[S('¿Cuándo avisamos?','When do we notify?','order + outbox','BEGIN insert order; insert outbox COMMIT','Outbox en la misma tx','Outbox in same tx','Si el pedido existe, el evento existe.','If the order exists, the event exists.','SMTP en el request','SMTP in the request','Cobro atado a email.','Charge tied to email.')] },
  auto: { es:'Autocomplete', en:'Autocomplete', blurb:{es:'Typeahead.',en:'Typeahead.'}, steps:[S('¿Capa?','Layer?','debounce → prefix cache','debounce 50ms; prefix topK','Debounce + cache','Debounce + cache','El prefijo se comparte.','The prefix is shared.','LIKE query','LIKE query','Full scan.','Full scan.')] },
};

export const incidents = [
  { t:{es:'Redis se cae',en:'Redis is down'}, q:{es:'60s. ¿Qué haces?',en:'60s. What do you do?'}, opts:[{ok:true,t:{es:'Fail open a DB + 429',en:'Fail open to DB + 429'},why:{es:'Producto vivo.',en:'Product lives.'}},{ok:false,t:{es:'500 hasta que vuelva',en:'500 until it returns'},why:{es:'Producto down.',en:'Product down.'}}] },
  { t:{es:'Replica lag 12s',en:'12s replica lag'}, q:{es:'No ven lo que crearon.',en:'They cannot see creates.'}, opts:[{ok:true,t:{es:'Read-your-writes',en:'Read-your-writes'},why:{es:'Sin strong global.',en:'No global strong.'}},{ok:false,t:{es:'Todo al primary',en:'All to primary'},why:{es:'El primary muere.',en:'Primary dies.'}}] },
  { t:{es:'Cache stampede',en:'Cache stampede'}, q:{es:'Key caliente expiró.',en:'Hot key expired.'}, opts:[{ok:true,t:{es:'Singleflight + jitter',en:'Singleflight + jitter'},why:{es:'Un refresh.',en:'One refresh.'}},{ok:false,t:{es:'Quitar cache',en:'Remove cache'},why:{es:'Stampede permanente.',en:'Permanent stampede.'}}] },
];
