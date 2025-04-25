import React, { useState, useEffect } from "react";
import { useNotification } from "../context/NotificationContext";
import { Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { PasswordData } from "../types/auth";
import { useChangePassword } from "../hooks/api/useAuthApi";


interface ProfileUpdateValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const ProfilePage: React.FC = () => {
  const { user, updateProfile, isLoading } = useAuthContext();
  const { showNotification } = useNotification();
  const changePasswordMutation = useChangePassword();

  // Form states
  const [profileData, setProfileData] = useState<ProfileUpdateValues>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    passwordConfirmation: "",
  });

  // UI states
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [isSubmittingProfile, setIsSubmittingProfile] =
    useState<boolean>(false);
  const [isSubmittingPassword, setIsSubmittingPassword] =
    useState<boolean>(false);
  const [profileUpdateSuccess, setProfileUpdateSuccess] =
    useState<boolean>(false);
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] =
    useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  // Handle profile form input changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });

    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Handle password form input changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });

    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Validate profile form
  const validateProfileForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!profileData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!profileData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!profileData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = "Email is invalid";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate password form
  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    if (!passwordData.passwordConfirmation) {
      newErrors.passwordConfirmation = "Password confirmation is required";
    } else if (passwordData.newPassword !== passwordData.passwordConfirmation) {
      newErrors.passwordConfirmation = "Passwords don't match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle profile update submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmittingProfile) return;
    if (!validateProfileForm()) return;

    try {
      setIsSubmittingProfile(true);
      await updateProfile(profileData);
      setProfileUpdateSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setProfileUpdateSuccess(false);
      }, 3000);

      showNotification("Profile updated successfully", { type: "success" });
    } catch (error) {
      console.error("Profile update error:", error);
      showNotification(
        error instanceof Error ? error.message : "Failed to update profile",
        { type: "error" }
      );
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  // Handle password update submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmittingPassword) return;
    if (!validatePasswordForm()) return;

    try {
      setIsSubmittingPassword(true);
      await changePasswordMutation.mutateAsync(passwordData);

      // Clear password fields after successful update
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        passwordConfirmation: "",
      });

      setPasswordUpdateSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setPasswordUpdateSuccess(false);
      }, 3000);

      showNotification("Password updated successfully", { type: "success" });
    } catch (error) {
      console.error("Password update error:", error);
      showNotification(
        error instanceof Error ? error.message : "Failed to update password",
        { type: "error" }
      );
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // If still loading auth state, show loading indicator
  if (isLoading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show login prompt
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Unable to load profile</h2>
          <p className="text-gray-600 mb-4">
            Please log in to access your profile.
          </p>
          <Link
            to="/login"
            className="inline-block bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-16">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8 px-4 sm:px-0">
          My Profile
        </h1>

        {/* Success notification for profile update */}
        {profileUpdateSuccess && activeTab === "profile" && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded shadow mx-4 sm:mx-0">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm leading-5 font-medium text-green-800">
                  Profile updated successfully
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success notification for password update */}
        {passwordUpdateSuccess && activeTab === "password" && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded shadow mx-4 sm:mx-0">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm leading-5 font-medium text-green-800">
                  Password updated successfully
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 px-4 sm:px-0">
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-white rounded-lg shadow p-4">
            <nav className="space-y-1">
              <h3 className="text-lg font-medium mb-3 text-gray-900">
                Account Settings
              </h3>
              <button
                onClick={() => setActiveTab("profile")}
                className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === "profile"
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === "password"
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Password & Security
              </button>
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1 bg-white rounded-lg shadow p-6">
            {/* Profile Information Tab */}
            {activeTab === "profile" && (
              <>
                <h2 className="text-lg font-medium mb-6 text-gray-900">
                  Profile Information
                </h2>
                <form onSubmit={handleProfileSubmit}>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* First name */}
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        First name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        id="firstName"
                        value={profileData.firstName}
                        onChange={handleProfileChange}
                        className={`w-full px-3 py-2 border ${
                          errors.firstName
                            ? "border-red-300"
                            : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.firstName}
                        </p>
                      )}
                    </div>

                    {/* Last name */}
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Last name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        id="lastName"
                        value={profileData.lastName}
                        onChange={handleProfileChange}
                        className={`w-full px-3 py-2 border ${
                          errors.lastName ? "border-red-300" : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.lastName}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email address
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        className={`w-full px-3 py-2 border ${
                          errors.email ? "border-red-300" : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Phone number
                      </label>
                      <input
                        type="text"
                        name="phone"
                        id="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={isSubmittingProfile}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400"
                    >
                      {isSubmittingProfile ? "Saving..." : "Save profile"}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Password & Security Tab */}
            {activeTab === "password" && (
              <>
                <h2 className="text-lg font-medium mb-6 text-gray-900">
                  Password & Security
                </h2>
                <form onSubmit={handlePasswordSubmit}>
                  <div className="space-y-4">
                    {/* Current password */}
                    <div>
                      <label
                        htmlFor="currentPassword"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Current password
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        id="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className={`w-full px-3 py-2 border ${
                          errors.currentPassword
                            ? "border-red-300"
                            : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                      />
                      {errors.currentPassword && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.currentPassword}
                        </p>
                      )}
                    </div>

                    {/* New password */}
                    <div>
                      <label
                        htmlFor="newPassword"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        New password
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        id="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className={`w-full px-3 py-2 border ${
                          errors.newPassword
                            ? "border-red-300"
                            : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                      />
                      {errors.newPassword ? (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.newPassword}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-gray-500">
                          Must be at least 8 characters long
                        </p>
                      )}
                    </div>

                    {/* Confirm new password */}
                    <div>
                      <label
                        htmlFor="passwordConfirmation"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Confirm new password
                      </label>
                      <input
                        type="password"
                        name="passwordConfirmation"
                        id="passwordConfirmation"
                        value={passwordData.passwordConfirmation}
                        onChange={handlePasswordChange}
                        className={`w-full px-3 py-2 border ${
                          errors.passwordConfirmation
                            ? "border-red-300"
                            : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                      />
                      {errors.passwordConfirmation && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.passwordConfirmation}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={isSubmittingPassword}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400"
                    >
                      {isSubmittingPassword
                        ? "Updating password..."
                        : "Update password"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
