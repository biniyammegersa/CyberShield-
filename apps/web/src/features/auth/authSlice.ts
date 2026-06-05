import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { setAccessToken, setOrganizationId } from '@/lib/api-client';
import type { AuthUser, OrganizationMembership } from '@/types/auth';

interface AuthState {
  user: AuthUser | null;
  memberships: OrganizationMembership[];
  currentOrganizationId: string | null;
  isAuthenticated: boolean;
}

const storedOrg = localStorage.getItem('cybershield_org_id');

const initialState: AuthState = {
  user: null,
  memberships: [],
  currentOrganizationId: storedOrg,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{
        accessToken: string;
        user: AuthUser;
        memberships: OrganizationMembership[];
      }>
    ) {
      const { accessToken, user, memberships } = action.payload;
      setAccessToken(accessToken);
      state.user = user;
      state.memberships = memberships;
      state.isAuthenticated = true;

      const orgId =
        state.currentOrganizationId &&
        memberships.some((m) => m.organizationId === state.currentOrganizationId)
          ? state.currentOrganizationId
          : memberships[0]?.organizationId ?? null;

      state.currentOrganizationId = orgId;
      if (orgId) {
        setOrganizationId(orgId);
        localStorage.setItem('cybershield_org_id', orgId);
      }
    },
    setOrganization(state, action: PayloadAction<string>) {
      state.currentOrganizationId = action.payload;
      setOrganizationId(action.payload);
      localStorage.setItem('cybershield_org_id', action.payload);
    },
    logout(state) {
      setAccessToken(null);
      setOrganizationId(null);
      localStorage.removeItem('cybershield_org_id');
      state.user = null;
      state.memberships = [];
      state.currentOrganizationId = null;
      state.isAuthenticated = false;
    },
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
    },
  },
});

export const { setCredentials, setOrganization, logout, setUser } = authSlice.actions;
export default authSlice.reducer;
