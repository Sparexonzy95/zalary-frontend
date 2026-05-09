import React from "react";
import { api } from "./api";
import { routes } from "./routes";
import type { ProfilePayload, Role } from "./types";
import { useWallet } from "./wallet";

export type OnboardingRole = Role;
export type OnboardingProfile = ProfilePayload;

type EmployerProfilePayload = {
  company_name: string;
  email: string;
  company_size?: string;
};

type EmployeeProfilePayload = {
  display_name?: string;
  email: string;
};

type EmailVerifyPayload = {
  code: string;
  email?: string;
};

type ProfileResponse = {
  profile: ProfilePayload;
  dev_email_code?: string;
};

type OnboardingContextValue = {
  loading: boolean;
  token: string;
  profile: ProfilePayload | null;
  activeWallet: string;

  loginWithWallet: (role: Role) => Promise<ProfilePayload>;
  refresh: () => Promise<ProfilePayload | null>;
  logout: () => void;
  isOnboarded: (role: Role, candidateProfile?: ProfilePayload | null) => boolean;

  saveEmployerProfile: (
    payload: EmployerProfilePayload,
  ) => Promise<ProfileResponse>;
  saveEmployeeProfile: (
    payload: EmployeeProfilePayload,
  ) => Promise<ProfileResponse>;
  verifyEmail: (payload: EmailVerifyPayload) => Promise<ProfilePayload>;
  markEmployeePrivateAccess: () => Promise<ProfilePayload>;
};

const TOKEN_KEY = "zalary:onboarding_token";

const OnboardingContext = React.createContext<OnboardingContextValue | null>(
  null,
);

function normalizeWallet(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function getEmployer(profile: any) {
  return (
    profile?.employer ??
    profile?.employer_profile ??
    profile?.employerProfile ??
    null
  );
}

function getEmployee(profile: any) {
  return (
    profile?.employee ??
    profile?.employee_profile ??
    profile?.employeeProfile ??
    null
  );
}

function profileWalletMatches(profile: ProfilePayload | null, wallet: string) {
  if (!profile) return false;

  const profileWallet = normalizeWallet(profile.wallet_address);
  const activeWallet = normalizeWallet(wallet);

  // Do not block routing while wallet state is still hydrating.
  if (!profileWallet || !activeWallet) return true;

  return profileWallet === activeWallet;
}

function employerCompleted(profile: ProfilePayload | null) {
  if (!profile || !profile.email_verified) return false;

  const employer = getEmployer(profile);

  return Boolean(
    employer &&
      employer.onboarding_completed &&
      String(employer.company_name || "").trim() &&
      String(employer.work_email || "").trim(),
  );
}

function employeeCompleted(profile: ProfilePayload | null) {
  if (!profile || !profile.email_verified) return false;

  const employee = getEmployee(profile);

  return Boolean(
    employee &&
      employee.onboarding_completed &&
      String(employee.notification_email || "").trim() &&
      employee.private_access_enabled,
  );
}

function readStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function storeToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { wallet, connect, signMessage, disconnect } = useWallet();

  const [token, setToken] = React.useState(readStoredToken);
  const [profile, setProfile] = React.useState<ProfilePayload | null>(null);
  const [loading, setLoading] = React.useState(Boolean(readStoredToken()));

  async function refresh(): Promise<ProfilePayload | null> {
    const storedToken = readStoredToken();

    if (!storedToken) {
      setToken("");
      setProfile(null);
      setLoading(false);
      return null;
    }

    setLoading(true);

    try {
      const { data } = await api.get(routes.onboarding.profile);
      const nextProfile = data as ProfilePayload;

      setToken(storedToken);
      setProfile(nextProfile);

      return nextProfile;
    } catch {
      clearStoredToken();
      setToken("");
      setProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loginWithWallet(role: Role): Promise<ProfilePayload> {
    const address = wallet || (await connect());

    const nonceRes = await api.post(routes.onboarding.nonce, {
      wallet_address: address,
    });

    const signature = await signMessage(nonceRes.data.message);

    const verifyRes = await api.post(routes.onboarding.verify, {
      wallet_address: address,
      signature,
      role,
    });

    const nextToken = String(verifyRes.data.token || "");
    const nextProfile = verifyRes.data.profile as ProfilePayload;

    if (!nextToken) {
      throw new Error("Local demo state service did not return onboarding token.");
    }

    storeToken(nextToken);
    setToken(nextToken);
    setProfile(nextProfile);

    return nextProfile;
  }

  async function saveEmployerProfile(
    payload: EmployerProfilePayload,
  ): Promise<ProfileResponse> {
    const res = await api.post(routes.onboarding.employerProfile, {
      company_name: payload.company_name,
      company_size: payload.company_size || "",
      email: payload.email,
    });

    const data = res.data as ProfileResponse;

    if (data.profile) {
      setProfile(data.profile);
    }

    return data;
  }

  async function saveEmployeeProfile(
    payload: EmployeeProfilePayload,
  ): Promise<ProfileResponse> {
    const res = await api.post(routes.onboarding.employeeProfile, {
      display_name: payload.display_name || "",
      email: payload.email,
    });

    const data = res.data as ProfileResponse;

    if (data.profile) {
      setProfile(data.profile);
    }

    return data;
  }

  async function verifyEmail(
    payload: EmailVerifyPayload,
  ): Promise<ProfilePayload> {
    const res = await api.post(routes.onboarding.verifyEmail, {
      code: payload.code,
      email: payload.email,
    });

    const nextProfile = res.data.profile as ProfilePayload;

    if (!nextProfile) {
      throw new Error("Local demo state service did not return profile after email verification.");
    }

    setProfile(nextProfile);

    return nextProfile;
  }

  async function markEmployeePrivateAccess(): Promise<ProfilePayload> {
    const res = await api.post(routes.onboarding.privateAccess, {});
    const nextProfile = res.data.profile as ProfilePayload;

    if (!nextProfile) {
      throw new Error("Local demo state service did not return profile after enabling access.");
    }

    setProfile(nextProfile);

    return nextProfile;
  }

  function logout() {
    clearStoredToken();
    setToken("");
    setProfile(null);
    disconnect();
  }

  function isOnboarded(role: Role, candidateProfile?: ProfilePayload | null) {
    const activeProfile = candidateProfile ?? profile;
    const activeToken = readStoredToken() || token;

    if (!activeToken || !activeProfile) return false;

    if (wallet && !profileWalletMatches(activeProfile, wallet)) {
      return false;
    }

    if (role === "employer") {
      return employerCompleted(activeProfile);
    }

    return employeeCompleted(activeProfile);
  }

  const value: OnboardingContextValue = {
    loading,
    token,
    profile,
    activeWallet: wallet,
    loginWithWallet,
    refresh,
    logout,
    isOnboarded,
    saveEmployerProfile,
    saveEmployeeProfile,
    verifyEmail,
    markEmployeePrivateAccess,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = React.useContext(OnboardingContext);

  if (!ctx) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }

  return ctx;
}
