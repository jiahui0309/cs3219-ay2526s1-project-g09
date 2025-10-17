import React, { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { questionFormSchema, type QuestionForm } from "./QuestionSchemas";
import FormField from "./FormField";
import HintsSection from "./HintsSection";
import { useHints } from "./useHints";
import type z from "zod";

interface QuestionFormUiProps {
  initialValues?: QuestionForm;
  mode: "add" | "edit";
  onSubmit: (data: QuestionForm) => Promise<void>;
  onBack: () => void;
}

const QuestionFormUi: React.FC<QuestionFormUiProps> = ({
  initialValues,
  mode,
  onSubmit,
  onBack,
}) => {
  const { hints, add, remove, update, cleaned } = useHints(
    initialValues?.hints,
  );

  type RawForm = z.input<typeof questionFormSchema>;

  const [previewMode, setPreviewMode] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RawForm, undefined, QuestionForm>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      categoryTitle: initialValues?.categoryTitle ?? "",
      difficulty: initialValues?.difficulty ?? "Easy",
      timeLimit: initialValues?.timeLimit ?? 60,
      content: initialValues?.content ?? "",
      hints: initialValues?.hints ?? [],
    },
  });

  const watchedContent = watch("content"); // watch content field

  const handleFormSubmit: SubmitHandler<QuestionForm> = async (data) => {
    await onSubmit({ ...data, hints: cleaned });
  };

  useEffect(() => {
    if (initialValues) {
      reset(initialValues);
    }
  }, [initialValues, reset]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">
        {mode === "add" ? "Add New Question" : "Edit Question"}
      </h2>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex gap-6">
        {/* Left Column: Main question content */}
        <div className="flex-[2] flex flex-col gap-6 overflow-y-auto h-[80vh]">
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 text-gray-200 flex flex-col gap-4">
            <FormField label="Title *" error={errors.title?.message}>
              <input
                {...register("title")}
                placeholder="e.g., Two Sum"
                className="p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </FormField>

            <FormField
              label="Content (HTML allowed) *"
              error={errors.content?.message}
            >
              {/* Toggle Buttons */}
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  className={`px-3 py-1 rounded ${
                    !previewMode
                      ? "bg-blue-600 text-white"
                      : "bg-gray-600 text-gray-200"
                  }`}
                  onClick={() => setPreviewMode(false)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded ${
                    previewMode
                      ? "bg-blue-600 text-white"
                      : "bg-gray-600 text-gray-200"
                  }`}
                  onClick={() => setPreviewMode(true)}
                >
                  Preview
                </button>
              </div>

              {previewMode ? (
                <div
                  className="p-2 rounded bg-gray-700 border border-gray-600 text-white font-mono text-sm overflow-y-auto h-[30vh]"
                  style={{ minHeight: "200px" }}
                  dangerouslySetInnerHTML={{ __html: watchedContent }}
                />
              ) : (
                <textarea
                  {...register("content")}
                  rows={8}
                  placeholder="Enter the question description..."
                  className="p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none font-mono text-sm w-full"
                />
              )}
            </FormField>

            <HintsSection
              hints={hints}
              add={add}
              remove={remove}
              update={update}
            />
          </div>
        </div>

        {/* Right Column: Meta info + actions */}
        <div className="flex-[1] flex flex-col gap-6">
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 text-gray-200 flex flex-col gap-4">
            <FormField label="Category *" error={errors.categoryTitle?.message}>
              <input
                {...register("categoryTitle")}
                placeholder="e.g., Array"
                className="p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </FormField>

            <FormField label="Difficulty *" error={errors.difficulty?.message}>
              <select
                {...register("difficulty")}
                className="p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </FormField>

            <FormField
              label="Time Limit (minutes) *"
              error={errors.timeLimit?.message}
            >
              <input
                type="number"
                {...register("timeLimit", { valueAsNumber: true })}
                min={1}
                max={240}
                className="p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </FormField>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white w-full"
              >
                {isSubmitting
                  ? mode === "add"
                    ? "Creating..."
                    : "Saving..."
                  : mode === "add"
                    ? "Create Question"
                    : "Save Changes"}
              </Button>

              <Button
                type="button"
                onClick={() => reset(initialValues)}
                variant="outline"
                className="flex-1 text-black w-full"
                disabled={isSubmitting}
              >
                Reset
              </Button>

              <Button
                onClick={onBack}
                variant="outline"
                className="flex-1 w-full bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
              >
                Back
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default QuestionFormUi;
