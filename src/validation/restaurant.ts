import { z } from "zod";

const optionalUrl = z
  .string()
  .url("Invalid image URL")
  .optional()
  .nullable();
const optionalLatitude = z.number().min(-90).max(90).optional().nullable();
const optionalLongitude = z.number().min(-180).max(180).optional().nullable();

export const createRestaurantSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  fullAddress: z.string().min(1, "Full address is required").trim(),
  phone: z.string().min(1, "Phone is required").trim(),
  cuisineType: z.string().min(1, "Cuisine type is required").trim(),
  imageUrl: optionalUrl,
  latitude: optionalLatitude,
  longitude: optionalLongitude,
}).superRefine((value, ctx) => {
  const hasLat = value.latitude !== undefined && value.latitude !== null;
  const hasLng = value.longitude !== undefined && value.longitude !== null;
  if (hasLat !== hasLng) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["latitude"],
      message: "Latitude and longitude must be provided together",
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["longitude"],
      message: "Latitude and longitude must be provided together",
    });
  }
});

export const updateRestaurantSchema = z.object({
  name: z.string().min(1, "Name is required").trim().optional(),
  fullAddress: z.string().min(1, "Full address is required").trim().optional(),
  phone: z.string().min(1, "Phone is required").trim().optional(),
  cuisineType: z.string().min(1, "Cuisine type is required").trim().optional(),
  imageUrl: optionalUrl,
  latitude: optionalLatitude,
  longitude: optionalLongitude,
}).superRefine((value, ctx) => {
  const hasLat = value.latitude !== undefined && value.latitude !== null;
  const hasLng = value.longitude !== undefined && value.longitude !== null;
  if (hasLat !== hasLng) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["latitude"],
      message: "Latitude and longitude must be provided together",
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["longitude"],
      message: "Latitude and longitude must be provided together",
    });
  }
});

export const createCommentSchema = z.object({
  body: z
    .string()
    .min(1, "Comment body is required")
    .max(2000, "Comment must be at most 2000 characters")
    .trim(),
});

export const setRatingSchema = z.object({
  stars: z
    .number()
    .int("Stars must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
});

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type SetRatingInput = z.infer<typeof setRatingSchema>;
