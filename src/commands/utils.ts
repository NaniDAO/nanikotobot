import { queryNaniMemory } from "@/telegram/history";
import { getPageSummary, googleIt } from "./web";


type CommandFunction = (arg: string) => Promise<string>;

interface Command {
    name: string;
    action: CommandFunction;
    input: string;
}

const commands: Command[] = [
    { name: '/google', action: googleIt, input: 'query' },
    { name: '/read', action: async (url: string) => {
        const res = await getPageSummary(1000, url);
        return res.summary;
    }, input: 'url' },
    {
      name: '/memory',
      action: queryNaniMemory,
      input: 'remember'
    },
];

export const getNaniCommandInstructions = ():string => {
    return commands.map(command => `- ${command.name} <${command.input}> - ${command.action.name}`).join('\n')
}

export const getNaniCommands = ():Command[] => {
    return commands;
}