import { z } from "zod";

export enum CommandAction {
  Send = "send",
}

export const SendParamsSchema = z.object({
  amount: z.string(),
  token: z.string(),
  recipient: z.string(),
});

export type SendParams = z.infer<typeof SendParamsSchema>;

export const resolveCommand = (
  command: string
): {
  action: CommandAction;
  params: SendParams;
} => {
  const parts = command.toLowerCase().split(" ");

  if (parts[0] === "send") {
    const amount = parts[1];
    const token = parts[2].toUpperCase();
    const recipient = parts.slice(4).join(" ");

    return {
      action: CommandAction.Send,
      params: {
        amount,
        token,
        recipient,
      },
    };
  }

  throw new Error("Invalid command");
};
