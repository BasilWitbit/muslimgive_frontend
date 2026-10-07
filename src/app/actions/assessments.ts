'use server'

import { _post, _patch, _get } from "@/auth";
import { ResponseType } from "../lib/definitions";
import { revalidatePath } from 'next/cache';

export type SubmitAssessmentPayload = {
    charityId: string;
    coreArea: number;
    answers: Record<string, any>;
}

/**
 * POST /audits/submissions
 * Submits an assessment for a charity
 */
export const submitAssessmentAction = async (payload: SubmitAssessmentPayload): Promise<ResponseType> => {
    console.log('[submitAssessmentAction] Payload:', JSON.stringify(payload, null, 2));
    const res = await _post('/audits/submissions', payload);
    console.log('[submitAssessmentAction] Response:', JSON.stringify(res, null, 2));
    if (res.ok) {
        revalidatePath(`/charities/${payload.charityId}`, 'layout');
    }
    return res;
}

export type CompleteAssessmentPayload = {
    charityId: string;
    coreArea: number;
    answers?: Record<string, any>;
}

/**
 * PATCH /audits/submissions/complete
 * Marks an assessment submission as complete
 */
export const completeAssessmentAction = async (payload: CompleteAssessmentPayload): Promise<ResponseType> => {
    const res = await _patch('/audits/submissions/complete', payload);
    if (res.ok) {
        revalidatePath(`/charities/${payload.charityId}`, 'layout');
    }
    return res;
}

/**
 * GET /audits/charities/{charityId}?core-area={coreArea}
 * Fetches saved/completed assessment data
 */
export const getAssessmentAction = async (charityId: string, coreArea: number): Promise<ResponseType> => {
    return await _get(`/audits/charities/${charityId}?core-area=${coreArea}`);
}

/**
 * PATCH /audits/submissions/edit
 * Allows editing an already-submitted/completed audit.
 */
export const editAssessmentAction = async (payload: SubmitAssessmentPayload): Promise<ResponseType> => {
    console.log('[editAssessmentAction] Payload:', JSON.stringify(payload, null, 2));
    const res = await _patch('/audits/submissions/edit', payload);
    console.log('[editAssessmentAction] Response:', JSON.stringify(res, null, 2));
    if (res.ok) {
        revalidatePath(`/charities/${payload.charityId}`, 'layout');
    }
    return res;
}

/**
 * GET /audits/charities/{charityId}/history?core-area={coreArea}
 * Fetches the field-level change log (who changed what, when, before/after)
 * for a charity's assessments. Financial/Zakah history is only returned to
 * viewers authorized for that area.
 */
export const getAssessmentHistoryAction = async (charityId: string, coreArea?: number): Promise<ResponseType> => {
    const query = typeof coreArea === 'number' ? `?core-area=${coreArea}` : '';
    return await _get(`/audits/charities/${charityId}/history${query}`);
}
