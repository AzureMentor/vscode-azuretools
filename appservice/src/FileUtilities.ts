/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as archiver from 'archiver';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export function getFileExtension(fsPath: string): string | undefined {
    return fsPath.split('.').pop();
}

export async function isDirectory(fsPath: string): Promise<boolean> {
    const fsStats: fs.Stats = await new Promise((resolve: (s?: fs.Stats) => void, reject: (e: Error) => void): void => {
        fs.lstat(fsPath, (err?: Error, stats?: fs.Stats) => {
            if (err) {
                reject(err);
            } else {
                resolve(stats);
            }
        });
    });

    return fsStats.isDirectory();
}

export async function zipFile(filePath: string): Promise<string> {
    const zipFilePath: string = path.join(os.tmpdir(), `${randomFileName()}.zip`);
    await new Promise((resolve: () => void, reject: (err: Error) => void): void => {
        const zipOutput: fs.WriteStream = fs.createWriteStream(zipFilePath);
        const zipper: archiver.Archiver = archiver('zip');
        zipOutput.on('close', resolve);
        zipper.on('error', reject);
        zipper.pipe(zipOutput);
        zipper.file(filePath, { name: path.basename(filePath) });
        zipper.finalize();
    });
    return zipFilePath;
}

export async function zipDirectory(folderPath: string, globPattern: string = '**/*', ignorePattern?: string | string[]): Promise<string> {
    if (!folderPath.endsWith(path.sep)) {
        folderPath += path.sep;
    }

    const zipFilePath: string = path.join(os.tmpdir(), `${randomFileName()}.zip`);
    await new Promise((resolve: () => void, reject: (err: Error) => void): void => {
        const zipOutput: fs.WriteStream = fs.createWriteStream(zipFilePath);
        zipOutput.on('close', resolve);

        const zipper: archiver.Archiver = archiver('zip', { zlib: { level: 9 } });
        zipper.on('error', reject);
        zipper.pipe(zipOutput);
        zipper.glob(globPattern, {
            cwd: folderPath,
            dot: true,
            ignore: ignorePattern
        });
        void zipper.finalize();
    });

    return zipFilePath;
}

export function randomFileName(): string {
    // tslint:disable-next-line:insecure-random
    return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
}
