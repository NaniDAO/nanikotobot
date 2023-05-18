export const CREATE_TX = `

`;

export const EXTRACT_VOTE = `Your task is to extract the vote from the message content.

Proposal:
[[[proposal]]]

Vote:
[[[content]]]

You must respond with a JSON object with the following format:
\`\`\`json
{
    "vote": [true|false],
    "confidence": [a number between 0 and 1]
}
`