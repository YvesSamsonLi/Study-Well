// Thin frontend client for AcademicCalendarService ingestion endpoints

import axios, { AxiosInstance } from "axios";
import FormData from "form-data";
import {
  AcademicUploadMeta,
  AcademicUploadQuery,
  AcademicUploadResponse,
  AcademicUploadQueryDTO,
  AcademicUploadMetaDTO,
  AcademicUploadRespDTO,
  AcademicMultipartFields,
} from "../contracts/ingestion.academic";

export class AcademicIngestionClient {
  constructor(private http: AxiosInstance) {}

  /** POST /v1/ingestion/academic/upload (multipart/form-data) */
  async upload({
    file,
    query,
    meta,
  }: {
    file: Blob | File | Buffer;
    query: AcademicUploadQueryDTO;
    meta: AcademicUploadMetaDTO;
  }): Promise<AcademicUploadRespDTO> {
    const q = AcademicUploadQuery.parse(query);
    const m = AcademicUploadMeta.parse(meta);

    const fd = new FormData();
    fd.append(AcademicMultipartFields.fileField, file as any, m.originalFilename);
    fd.append(AcademicMultipartFields.metaField, JSON.stringify(m));

    const res = await this.http.post(
      "/v1/ingestion/academic/upload",
      fd,
      { params: q, headers: fd.getHeaders?.() }
    );

    return AcademicUploadResponse.parse(res.data);
  }
}
