export interface VideoInfo {
	id: string;
	title: string;
	channel: string;
	ext: string;
}

export interface VideoJSON extends VideoInfo {
	width: number;
	height: number;
	resolution: string;
	duration_string: string;
}
