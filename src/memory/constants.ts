import dotenv from "dotenv";

dotenv.config();

export const config = {
    uri: process.env.MILVUS_URI,
    user: "db_admin",
    password: process.env.MILVUS_PASSWORD,
    secure: true,
};
