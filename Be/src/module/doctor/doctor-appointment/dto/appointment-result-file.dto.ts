export class AppointmentResultFileDto {
  id: number;
  fileUrl: string;
  fileType: string;
  fileName: string;
  fileSize: number;
  createdAt: Date;
}

export class CreateResultFileDto {
  fileUrl: string;
  fileType: string;
  fileName: string;
  fileSize: number;
}
