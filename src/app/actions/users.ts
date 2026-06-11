'use server'

import { _get, _getWithAccessToken, _patch, _post, authAdapter } from "@/auth";
import { ChangePasswordPayload, ResponseType, UserProfile } from "../lib/definitions";
import type { CountriesInKebab } from "@/components/common/CountrySelectComponent/countries.types";
import { unstable_cache, revalidateTag, revalidatePath } from 'next/cache';

export type CreateMgMemberPayload = {
    firstName: string;
    lastName: string;
    email: string;
    countryName?: CountriesInKebab;
    postalCode?: string;
    roles: string[];
}

export type UpdateUserRolesPayload = {
    add: string[];
    remove: string[];
}

/**
 * Filter Params for List Users
 * (Inferred from standard practices as precise docs were not provided for listing params)
 */
export type ListUsersParams = {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
}

/**
 * GET /admin/users
 * Lists all users. Useful for role assignment search.
 */
export const listUsersAction = async (params?: ListUsersParams): Promise<ResponseType> => {
    const query = new URLSearchParams();

    // Although the user query showed no params, typically listing endpoints support at least searching
    // Adding basics here securely. If backend ignores them, no harm done.
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.role) query.append('role', params.role); // e.g., 'project-manager'

    const endpoint = `/users?${query.toString()}`;
    return await _get(endpoint);
}

/**
 * GET /admin/users/read-only
 * Lists all read-only users.
 */
export const listReadOnlyUsersAction = async (params?: ListUsersParams): Promise<ResponseType> => {
    const query = new URLSearchParams();

    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);

    const endpoint = `/admin/users/read-only?${query.toString()}`;
    return await _get(endpoint);
}

// Cached version of getMeAction for layout - revalidates every 60 seconds
const getCachedMe = unstable_cache(
    async (token: string) => _getWithAccessToken('/users/me', token),
    ['user-me'],
    { revalidate: 60, tags: ['user-me'] }
);

/**
 * GET /users/me
 * Fetches the currently logged-in user's profile
 * Uses caching for layout performance - revalidates every 60 seconds
 */
export const getMeAction = async (useCache = false): Promise<ResponseType<UserProfile>> => {
    if (useCache) {
        await authAdapter.maybeRefresh();
        const accessToken = await authAdapter.getToken();
        if (!accessToken) {
            return { ok: false, payload: null, unauthenticated: true, message: 'Unauthorized' };
        }
        return await getCachedMe(accessToken);
    }
    return await _get('/users/me');
}

/**
 * PATCH /users/change-password
 * Updates the user's password
 */
export const changePasswordAction = async (payload: ChangePasswordPayload): Promise<ResponseType> => {
    return await _patch('/users/change-password', payload);
}

/**
 * POST /admin/mg-member
 * Creates a new internal staff member
 */
export const createMgMemberAction = async (payload: CreateMgMemberPayload): Promise<ResponseType> => {
    return await _post('/admin/mg-member', payload);
}

/**
 * GET /users/{id}/roles
 * Fetches the roles for a specific user
 */
export const getUserRolesAction = async (userId: string): Promise<ResponseType> => {
    return await _get(`/users/${userId}/roles`);
}

/**
 * PATCH /roles/assign/{user_id}
 * Updates the roles for a specific user
 */
export const updateUserRolesAction = async (userId: string, payload: UpdateUserRolesPayload): Promise<ResponseType> => {
    return await _patch(`/roles/assign/${userId}`, payload);
}

/**
 * Payload for updating the current user's profile
 */
export type UpdateMePayload = {
    firstName?: string;
    lastName?: string;
    countryName?: CountriesInKebab | null;
    postalCode?: string;
}

/**
 * PATCH /users/me
 * Updates the currently logged-in user's profile (partial updates supported)
 */
export const updateMeAction = async (payload: UpdateMePayload): Promise<ResponseType> => {
    return await _patch('/users/me', payload);
}

export type RequestEmailChangePayload = {
    newEmail: string;
    currentPassword: string;
}

export type VerifyEmailChangePayload = {
    newEmail: string;
    otp: string;
}

/**
 * POST /users/email-change/request
 * Sends a verification code to the new email
 */
export const requestEmailChangeAction = async (payload: RequestEmailChangePayload): Promise<ResponseType> => {
    return await _post('/users/email-change/request', payload);
}

/**
 * POST /users/email-change/resend
 * Resends the verification code to the new email
 */
export const resendEmailChangeAction = async (payload: RequestEmailChangePayload): Promise<ResponseType> => {
    return await _post('/users/email-change/resend', payload);
}

/**
 * POST /users/email-change/verify
 * Verifies the code and updates the email
 */
export const verifyEmailChangeAction = async (payload: VerifyEmailChangePayload): Promise<ResponseType> => {
    return await _post('/users/email-change/verify', payload);
}

/**
 * PATCH /users/me/profile-picture
 * Updates the currently logged-in user's profile picture
 */
export const updateProfilePictureAction = async (formData: FormData): Promise<ResponseType> => {
    const res = await _patch('/users/me/profile-picture', formData);
    if (res.ok) {
        revalidateTag('user-me');
        revalidatePath('/');
    }
    return res;
}

/**
 * PATCH /admin/users/{id}/delete-status
 * Soft-deletes a user
 */
export const deleteUserAction = async (id: string, isDeleted: boolean = true): Promise<ResponseType> => {
    return await _patch(`/admin/users/${id}/delete-status`, { isDeleted });
}
