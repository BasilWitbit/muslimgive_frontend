'use server'

import { _get, _patch, _post } from "@/auth";
import { ResponseType } from "../lib/definitions";

export type ExcludedAssessor = { id: string; name: string; email: string };

/** GET /charities/:id/excluded-assessors */
export const getExcludedAssessorsAction = async (charityId: string): Promise<ResponseType<ExcludedAssessor[]>> => {
    return await _get(`/charities/${charityId}/excluded-assessors`);
};

/** PATCH /charities/:id/excluded-assessors — replaces the full exclusion list for the charity. */
export const setExcludedAssessorsAction = async (
    charityId: string,
    excludedAssessorIds: string[],
): Promise<ResponseType> => {
    return await _patch(`/charities/${charityId}/excluded-assessors`, { excludedAssessorIds });
};

/** POST /charities/:id/conflict-declaration — the assessor's mandatory pre-assessment tick. */
export const declareConflictAction = async (
    charityId: string,
    coreArea: 2 | 3,
    hasConflict: boolean,
): Promise<ResponseType<{ hasConflict: boolean }>> => {
    return await _post(`/charities/${charityId}/conflict-declaration`, { coreArea, hasConflict });
};

/** GET /charities/:id/conflict-declaration?coreArea= — this assessor's existing declaration, if any. */
export const getMyDeclarationAction = async (
    charityId: string,
    coreArea: 2 | 3,
): Promise<ResponseType<{ hasConflict: boolean } | null>> => {
    return await _get(`/charities/${charityId}/conflict-declaration?coreArea=${coreArea}`);
};

export type OperationsTask = {
    id: string;
    charityId: string;
    charityName: string;
    assessorUserId: string | null;
    assessorName: string | null;
    coreArea: number;
    coreAreaLabel: string;
    message: string;
    createdAt: string;
};

/** GET /operations-tasks — the Operations Manager's open task list. */
export const listOperationsTasksAction = async (): Promise<ResponseType<OperationsTask[]>> => {
    return await _get('/operations-tasks');
};

/** PATCH /operations-tasks/:id/resolve */
export const resolveOperationsTaskAction = async (taskId: string): Promise<ResponseType> => {
    return await _patch(`/operations-tasks/${taskId}/resolve`, {});
};
