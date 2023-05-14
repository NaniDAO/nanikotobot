import { googleIt } from "@/commands/web";


const main = () => {
    googleIt("test").then((res) => {
        console.log(res);
    }).catch((err) => {
        console.log(err);
    });
}

main(); 