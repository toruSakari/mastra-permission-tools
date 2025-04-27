type EventCallback<T = any> = (data: T) => void;

export class EventEmitter<Events extends Record<string, any>> {
	private events: Map<keyof Events, Set<EventCallback>> = new Map();

	on<K extends keyof Events>(
		event: K,
		callback: EventCallback<Events[K]>,
	): void {
		if (!this.events.has(event)) {
			this.events.set(event, new Set());
		}
		this.events.get(event)!.add(callback);
	}

	off<K extends keyof Events>(
		event: K,
		callback: EventCallback<Events[K]>,
	): void {
		const callbacks = this.events.get(event);
		if (callbacks) {
			callbacks.delete(callback);
			if (callbacks.size === 0) {
				this.events.delete(event);
			}
		}
	}

	emit<K extends keyof Events>(event: K, data: Events[K]): void {
		const callbacks = this.events.get(event);
		if (callbacks) {
			callbacks.forEach((callback) => {
				try {
					callback(data);
				} catch (error) {
					console.error(`Error in event handler for ${String(event)}:`, error);
				}
			});
		}
	}

	once<K extends keyof Events>(
		event: K,
		callback: EventCallback<Events[K]>,
	): void {
		const onceCallback = (data: Events[K]) => {
			callback(data);
			this.off(event, onceCallback);
		};
		this.on(event, onceCallback);
	}

	clear(): void {
		this.events.clear();
	}
}

// 型定義
export interface PermissionEvents {
	permissionRequested: {
		toolName: string;
		userId: string;
		parameters: Record<string, any>;
	};
	permissionGranted: {
		toolName: string;
		userId: string;
	};
	permissionDenied: {
		toolName: string;
		userId: string;
	};
	permissionExpired: {
		toolName: string;
		userId: string;
	};
}

// 許可イベントエミッター
export const permissionEvents = new EventEmitter<PermissionEvents>();
