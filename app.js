import { IncomingMessage, ServerResponse, createServer } from 'node:http';
import { readFile, writeFile, appendFile, readdir, stat, rm } from 'node:fs/promises';


/**
 * @param { IncomingMessage } req 
 * @param { ServerResponse } res 
 */

const rootFolder = '.';

async function router(req, res) {
    const method = req.method;
    const path = rootFolder + req.url;

    switch (method) {

        // GET на директорию,
        // например GET / — возвращает список файлов в виде простого текста,
        // где имена файлов разделены переводом строки (\n).

        // GET на файл, например GET /name.txt — возвращает содержимое файла.
        case 'GET': {
            try {
                const stats = await stat(path);
                if (stats.isDirectory()) {
                    const files = await readdir(path);
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end(files.join('\n'));
                    // for (const file of files)
                    //   console.log(file);
                }
                else {
                    const contents = await readFile(path, { encoding: 'utf8' });
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end(contents);
                    // console.log(contents);
                }
            } catch (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found');
                // console.error(err);
            }
            break;
        }

        // HEAD на файл,
        // например HEAD /name.txt — возвращает заголовки,
        // позволяет узнать размер файла из заголовка Content-Length.
        case 'HEAD': {
            try {
                const stats = await stat(path);
                res.writeHead(200, {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Content-Length': stats.size,
                });
                res.end();
            } catch (err) {
                res.statusCode = 404;
                res.end('File not found');
            }
            break;
        }

        // PUT на файл,
        // например PUT /name.txt — сохраняет тело запроса под указанным именем.
        // Заменяет файл, если уже существует.
        case 'PUT': {
            
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', async () => {
                try {
                    await writeFile(path, body);
                    res.writeHead(200);
                    res.end('File saved');
                } catch (err) {
                    res.writeHead(500);
                    res.end('Server error');
                }
            });
            break;
        }

        // PATCH на файл,
        // например PATCH /name.txt — дописывает тело запроса в конец файла.
        // Если файла нет, то создаёт его.
        case 'PATCH': {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', async () => {
                try {
                    await appendFile(path, body);
                    res.writeHead(200);
                    res.end('File updated');
                } catch (err) {
                    res.writeHead(500);
                    res.end('Server error');
                }
            });
            break;
        }

        // DELETE на файл,
        // например DELETE /name.txt — удаляет указанный файл.
        case 'DELETE': {
            try {
                rm(path);
                res.writeHead(200);
                res.end('File deleted');
            } catch (err) {
                res.statusCode = 404;
                res.end('File not found');
            }
            break;
        }

        default: {
            res.statusCode = 404;
            res.end('Unexpected method');
        }
    }
}

const server = createServer(router);

server.on('error', (error) => {
    console.log(error);
    process.exit(1);
});

server.listen(
    8080, () => {
        console.log(`Server listening on http://localhost:8080`);
    }
);
