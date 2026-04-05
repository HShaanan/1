import { base44 } from "@/api/base44Client";

export const InvokeLLM = (params) => base44.integrations.Core.InvokeLLM(params);
export const SendEmail = (params) => base44.integrations.Core.SendEmail(params);
export const SendSMS = (params) => base44.integrations.Core.SendSMS(params);
export const UploadFile = (file) => base44.integrations.Core.UploadFile(file);
export const GenerateImage = (params) => base44.integrations.Core.GenerateImage(params);
export const ExtractDataFromUploadedFile = (params) => base44.integrations.Core.ExtractDataFromUploadedFile(params);
