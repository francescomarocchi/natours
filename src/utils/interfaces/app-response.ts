export interface AppResponse<T> {
	data: T | undefined;
	status: 'success' | 'error' | 'notfound';
	message?: string;
}
