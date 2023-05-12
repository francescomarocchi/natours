export interface AppResponse<T> {
	data: T;
	status: "success" | "error" | "notfound";
	message?: string;
}
