import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export const USER_ROLE = {
  ADMIN: "admin",
  USER: "user",
};

export interface CurrentUserDTO {
  username: string;
  role: (typeof USER_ROLE)[keyof typeof USER_ROLE];
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await apiClient.get<CurrentUserDTO>(
        "/users/current-user"
      );
      return response.data;
    },
  });
}
