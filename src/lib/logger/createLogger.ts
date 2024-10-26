import winston, { Logger } from 'winston';

//const customTimestampFormat = () => {
//    return new Date().toISOString().split('T')[1]!.replace('Z', '');
//};

function getFormatter() {
	//     if (__PROD__) {
	//         return winston.format.json();
	//     }
	return winston.format.combine(winston.format.colorize(), winston.format.printf(formatMessage));
}
export function createLogger(flags: { stout: boolean }) {
	const logger = winston.createLogger({
		level: 'debug',
		format: getFormatter(),
		transports: [
			new winston.transports.File({
				filename: './data/logs/error.log',
				level: 'error',
			}),
			new winston.transports.File({
				filename: './data/logs/combined.log',
			}),
		],
	});
	if (process.env.NODE_ENV !== 'production' && flags.stout) {
		logger.add(
			new winston.transports.Console({
				format: getFormatter(),
			})
		);
	}

	return logger;
}

function formatMessage(props: winston.Logform.TransformableInfo) {
	let finalMessage = `${props.level}: `;
	if (!Array.isArray(props)) {
		if (typeof props.message !== 'object') {
			finalMessage += props.message;
			return finalMessage;
		}
		let message = JSON.stringify(props.message, null, 5);

		const splitted = message.split('\n');
		for (let i = 0; i < splitted.length; i++) {
			const b = splitted[i];
			if (!b || b.length == 0) continue;
			if (i == 0) {
				finalMessage += `${b.trim()}\n`;
			} else {
				finalMessage += `${props.level}: ${b}\n`;
			}
		}
		return finalMessage;
	}

	for (const m of props.message) {
		if (typeof m !== 'object') {
			if (!m || m.length == 0) continue;
			finalMessage += `${props.level}: ${m}\n`;
			continue;
		}
		const message = JSON.stringify(m, null, 2);
		const splitted = message.split('\n');
		for (let i = 0; i < splitted.length - 1; i++) {
			const b = splitted[i];
			if (!b || b.length == 0) continue;
			finalMessage += `${props.level}: ${b}`;
		}
	}
	return finalMessage;
}

export class Logging {
	//private logs: Queue<LogMessage>;
	private instance?: Logging;
	private logger: Logger;

	constructor(logger: Logger) {
		this.logger = logger;
		if (this.instance) {
			throw new Error('Bad implementation');
		}
		//this.logs = new Queue();
		this.instance = this;
	}
	//private reset() {
	//     this.logs = new Queue();
	//}

	error(...items: any[]) {
		this.logger.error(items);
	}

	debug(...a: unknown[]) {
		if (Array.isArray(a)) {
			for (const item of a) {
				this.logger.debug(item);
			}
			return;
		}

		this.logger.debug(a);
	}

	assert(truthy: boolean, name: string, value?: unknown) {
		if (truthy) {
			return;
		}
		this.logger.log('warn', {
			name: name,
			data: value,
		});
	}

	//add(name: LogName | ({} & string), value: unknown) {
	add(name: string, value: unknown) {
		this.logger.info({
			name: name,
			data: value,
		});
		//this.info(`[${name}] => ${JSON.stringify(value)}`);
		//if (__TEST__) return this;
		//this.logs.enque({ name, value });
		//
		//if (this.logs.size === 1) {
		//     this.flush();
		//}
		//return this;
	}
	//private flush() {
	//     const paths: LogQueue<LogMessage> = new LogQueue();
	//     while (this.logs.size > 0) {
	//          const node = this.logs.deque();
	//
	//          if (node) paths.add(node);
	//     }
	//
	//     paths.save();
	//     this.reset();
	//}
}

//class LogQueue<T extends LogMessage> {
//     items: Queue<T>;
//
//     constructor() {
//          this.items = new Queue();
//     }
//     add(item: T) {
//          this.items.enque(item);
//     }
//     async save() {
//          const items: LogMessage[] = [];
//
//          while (this.items.size > 0) {
//               const item = this.items.deque();
//               if (item) {
//                    items.push(item);
//               }
//          }
//
//          if (items.length > 0)
//               await connection('logging').insert(items as never);
//     }
//}
