import { api as internalApi } from "@/lib/gen/internal.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import { useEffect } from "react";

export interface StoryConfigOptions {
  storyTypeOptions: Array<{ value: string; label: string }>;
  allGenreOptions: Array<{
    value: string;
    label: string;
    category: string;
  }>;
  storyLanguageOptions: Array<{ value: string; label: string }>;
  storyTagCategoryOptions: Array<{ value: string; label: string }>;
  allTagsOptions: Array<{
    value: string;
    label: string;
    category: string;
  }>;
  storyLengthOptions: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
  storyWritingContestOptions: Array<{ value: string; label: string }>;
  storyCategoryOptions: Array<{ value: string; label: string }>;
  storyWarningNoticeOptions: Array<{ value: string; label: string }>;
}

export const useStoryConfig = () => {
  const local = useLocal<StoryConfigOptions & { loading: boolean }>({
    loading: true,
    storyTypeOptions: [],
    allGenreOptions: [],
    storyLanguageOptions: [],
    storyTagCategoryOptions: [],
    allTagsOptions: [],
    storyLengthOptions: [],
    storyWritingContestOptions: [],
    storyCategoryOptions: [],
    storyWarningNoticeOptions: [],
  });

  useEffect(() => {
    const fetchConfigurations = async () => {
      try {
        const configKeys = [
          "story_type",
          "story_genre",
          "story_language",
          "story_tag_category",
          "story_tags",
          "story_length",
          "story_writing_contest",
          "story_category",
          "story_warning_notice",
        ];

        const bulkResponse = await internalApi.cfg_bulk_get({
          keys: configKeys,
        });

        if (!bulkResponse.success || !bulkResponse.data) {
          console.error(
            "Failed to fetch bulk configurations:",
            bulkResponse.message
          );
          return;
        }

        // Create a map for easier lookup
        const configMap = new Map<string, { key: string; value: string }>(
          bulkResponse.data.map((config) => [config.key, config])
        );

        const storyTypeResponse = {
          success: true,
          data: configMap.get("story_type"),
        };
        const storyGenreResponse = {
          success: true,
          data: configMap.get("story_genre"),
        };
        const storyLanguageResponse = {
          success: true,
          data: configMap.get("story_language"),
        };
        const storyTagCategoryResponse = {
          success: true,
          data: configMap.get("story_tag_category"),
        };
        const storyTagsResponse = {
          success: true,
          data: configMap.get("story_tags"),
        };
        const storyLengthResponse = {
          success: true,
          data: configMap.get("story_length"),
        };
        const storyWritingContestResponse = {
          success: true,
          data: configMap.get("story_writing_contest"),
        };
        const storyCategoryResponse = {
          success: true,
          data: configMap.get("story_category"),
        };
        const storyWarningNoticeResponse = {
          success: true,
          data: configMap.get("story_warning_notice"),
        };

        // Process story_type config
        if (storyTypeResponse.success && storyTypeResponse.data?.value) {
          try {
            const storyTypes: string[] = JSON.parse(
              storyTypeResponse.data.value
            );
            local.storyTypeOptions = storyTypes.map((type) => ({
              value: type,
              label: type,
            }));
          } catch (e) {
            console.error("Failed to parse story_type config:", e);
          }
        }

        // Process story_genre config
        if (storyGenreResponse.success && storyGenreResponse.data?.value) {
          try {
            const storyGenres: Array<{
              category: string;
              value: string | string[];
            }> = JSON.parse(storyGenreResponse.data.value);

            const allOptions: Array<{
              value: string;
              label: string;
              category: string;
            }> = [];

            storyGenres.forEach((item) => {
              if (Array.isArray(item.value)) {
                item.value.forEach((genre) => {
                  allOptions.push({
                    value: genre,
                    label: genre,
                    category: item.category,
                  });
                });
              } else {
                allOptions.push({
                  value: item.value,
                  label: item.value,
                  category: item.category,
                });
              }
            });

            local.allGenreOptions = allOptions;
          } catch (e) {
            console.error("Failed to parse story_genre config:", e);
            // Fallback data
            local.allGenreOptions = [
              { value: "Action", label: "Action", category: "Male Oriented" },
              {
                value: "Adventure",
                label: "Adventure",
                category: "Male Oriented",
              },
              {
                value: "Romance",
                label: "Romance",
                category: "Female Oriented",
              },
              { value: "Drama", label: "Drama", category: "Female Oriented" },
            ];
          }
        }

        // Process story_language config
        if (
          storyLanguageResponse.success &&
          storyLanguageResponse.data?.value
        ) {
          try {
            const storyLanguages: string[] = JSON.parse(
              storyLanguageResponse.data.value
            );
            local.storyLanguageOptions = storyLanguages.map((language) => ({
              value: language,
              label: language,
            }));
          } catch (e) {
            console.error("Failed to parse story_language config:", e);
          }
        }

        // Process story_tag_category config
        if (
          storyTagCategoryResponse.success &&
          storyTagCategoryResponse.data?.value
        ) {
          try {
            const storyTagCategories: string[] = JSON.parse(
              storyTagCategoryResponse.data.value
            );
            local.storyTagCategoryOptions = storyTagCategories.map(
              (category) => ({
                value: category,
                label: category,
              })
            );
          } catch (e) {
            console.error("Failed to parse story_tag_category config:", e);
          }
        }

        // Process story_tags config
        if (storyTagsResponse.success && storyTagsResponse.data?.value) {
          try {
            const storyTags: Array<{
              category: string;
              value: string | string[];
            }> = JSON.parse(storyTagsResponse.data.value);

            const allOptions: Array<{
              value: string;
              label: string;
              category: string;
            }> = [];

            storyTags.forEach((item) => {
              if (Array.isArray(item.value)) {
                item.value.forEach((tag) => {
                  allOptions.push({
                    value: tag,
                    label: tag,
                    category: item.category,
                  });
                });
              } else {
                allOptions.push({
                  value: item.value,
                  label: item.value,
                  category: item.category,
                });
              }
            });

            local.allTagsOptions = allOptions;
          } catch (e) {
            console.error("Failed to parse story_tags config:", e);
            // Fallback data
            local.allTagsOptions = [
              { value: "Action", label: "Action", category: "Male Oriented" },
              {
                value: "Adventure",
                label: "Adventure",
                category: "Male Oriented",
              },
              {
                value: "Romance",
                label: "Romance",
                category: "Female Oriented",
              },
              { value: "Drama", label: "Drama", category: "Female Oriented" },
            ];
          }
        }

        // Process story_length config
        if (storyLengthResponse.success && storyLengthResponse.data?.value) {
          try {
            const storyLengths: Array<{ key: string; description: string }> =
              JSON.parse(storyLengthResponse.data.value);
            local.storyLengthOptions = storyLengths.map((item) => ({
              value: item.key,
              label: item.key,
              description: item.description,
            }));
          } catch (e) {
            console.error("Failed to parse story_length config:", e);
          }
        }

        // Process story_writing_contest config
        if (
          storyWritingContestResponse.success &&
          storyWritingContestResponse.data?.value
        ) {
          try {
            const storyWritingContests: string[] = JSON.parse(
              storyWritingContestResponse.data.value
            );
            local.storyWritingContestOptions = storyWritingContests.map(
              (contest) => ({
                value: contest,
                label: contest,
              })
            );
          } catch (e) {
            console.error("Failed to parse story_writing_contest config:", e);
          }
        }

        // Process story_category config
        if (
          storyCategoryResponse.success &&
          storyCategoryResponse.data?.value
        ) {
          try {
            const storyCategories: string[] = JSON.parse(
              storyCategoryResponse.data.value
            );
            local.storyCategoryOptions = storyCategories.map((category) => ({
              value: category,
              label: category,
            }));
          } catch (e) {
            console.error("Failed to parse story_category config:", e);
          }
        }

        // Process story_warning_notice config
        if (
          storyWarningNoticeResponse.success &&
          storyWarningNoticeResponse.data?.value
        ) {
          try {
            const storyWarningNotices: string[] = JSON.parse(
              storyWarningNoticeResponse.data.value
            );
            local.storyWarningNoticeOptions = storyWarningNotices.map(
              (notice) => ({
                value: notice,
                label: notice,
              })
            );
          } catch (e) {
            console.error("Failed to parse story_warning_notice config:", e);
          }
        }
      } catch (error) {
        console.error("Failed to fetch configurations:", error);
      } finally {
        local.loading = false;
        local.render();
      }
    };

    fetchConfigurations();
  }, []);

  return local;
};
