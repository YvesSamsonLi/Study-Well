// Thin frontend client for SemesterCalendarService ingestion endpoints
// Works with an axios instance pre-configured with baseURL + auth header.

import axios, { AxiosInstance } from "axios";
import FormData from "form-data";
import {
  SemesterUploadQuery,
  SemesterUploadMeta,
  SemesterUploadResponse,
  SemesterMultipartFields,
  SemesterUploadQueryDTO,
  SemesterUploadMetaDTO,
  SemesterUploadRespDTO,
} from "../contracts/ingestion.semester";

export class SemesterIngestionClient {
  constructor(private http: AxiosInstance) {}

  /** POST /v1/ingestion/semester/upload (multipart/form-data) */
  async upload({
    file,
    query,
    meta,
  }: {
    file: Blob | File | Buffer;
    query: SemesterUploadQueryDTO;
    meta: SemesterUploadMetaDTO;
  }): Promise<SemesterUploadRespDTO> {
    // validate inputs against contracts
    const q = SemesterUploadQuery.parse(query);
    const m = SemesterUploadMeta.parse(meta);

    const fd = new FormData();
    fd.append(SemesterMultipartFields.fileField, file as any, m.originalFilename);
    fd.append(SemesterMultipartFields.metaField, JSON.stringify(m));

    const res = await this.http.post(
      "/v1/ingestion/semester/upload",
      fd,
      { params: q, headers: fd.getHeaders?.() }
    );

    return SemesterUploadResponse.parse(res.data);
  }


