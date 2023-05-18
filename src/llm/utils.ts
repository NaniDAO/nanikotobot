type TemplateVars = {
  [key: string]: string | number;
};

export const interpolateTemplate = (
  template: string,
  templateVars: TemplateVars
): string => {
  const missingVariableKeys: string[] = [];

  const interpolated = template.replace(
    /\[\[\[(\w+)\]\]\]/g,
    (_, variableName) => {
      if (templateVars[variableName] !== undefined) {
        return String(templateVars[variableName]);
      } else {
        missingVariableKeys.push(variableName);
        return ""; // always return a string
      }
    }
  );

  if (missingVariableKeys.length > 0) {
    throw new Error(`Missing variable keys: ${missingVariableKeys.join(", ")}`);
  }

  return interpolated;
};
