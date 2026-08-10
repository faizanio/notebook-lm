import { prisma } from "../../config/prisma.js";
import { indexingQueue } from "../queue/indexing.queue.js"
import { getAuth } from '@clerk/express'


export const createSource = async (req, res) => {
    console.log("Controller reached");
    try {
        // if (!req.file) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'PDF is required'
        //     })
        // }

        const { notebookId, type } = req.body

        if (!notebookId) {
            return res.status(400).json({
                success: false,
                message: 'notebookId is required'
            })
        }

        const { userId } = getAuth(req)
        if (!userId) {
            return res.status(401).json({ success: false, message: 'unauthorized' });
        }

        const notebook = await prisma.notebook.findFirst({ where: { id: notebookId, userId } });
        if (!notebook) {
            return res.status(404).json({ success: false, message: 'Notebook not found' });
        }

        if (!type) {
            return res.status(400).json({
                success: false,
                message: 'type is required'
            })
        }

        let sourceData = { notebookId, type, status: "UPLOADING" }
        let jobData = { notebookId, type }

        switch (type) {
            case 'PDF':
            case 'VTT':
                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: `${type} is required`
                    })
                }

                const ext = req.file.originalname.toLowerCase().split('.').pop()
                if (type === 'PDF' && ext !== 'pdf') {
                    return res.status(400).json({ success: false, message: 'File extension does not match type PDF' })
                }
                if (type === 'VTT' && ext !== 'vtt') {
                    return res.status(400).json({ success: false, message: 'File extension does not match type VTT' })
                }

                sourceData.name = req.file.originalname
                sourceData.originalPath = req.file.path
                jobData.filepath = req.file.path
                break

            case 'TEXT':
                const { content, name } = req.body
                if (!content) {
                    return res.status(400).json({
                        success: false,
                        message: `content is required`
                    })
                }

                if (content.length > 500_000) {
                    return res.status(400).json({ success: false, message: 'Content too large (max 500,000 characters)' })
                }

                sourceData.name = name || "Pasted Text"
                sourceData.content = content
                jobData.content = content
                break

            case 'URL':
            case 'YOUTUBE':
                const { url } = req.body
                if (!url) {
                    return res.status(400).json({
                        success: false,
                        message: `url is required`
                    })
                }

                sourceData.name = url
                sourceData.sourceUrl = url
                jobData.url = url
                break

            default:
                throw new Error(`Unsupported type: ${type}`)
        }

        // const source = await prisma.source.create({
        //     data: {
        //         notebookId,
        //         type: "PDF",
        //         name: req.file.originalname,
        //         originalPath: req.file.path,
        //         status: "UPLOADING",
        //     }
        // })

        const source = await prisma.source.create({ data: sourceData })
        jobData.sourceId = source.id

        // const job = await indexingQueue.add('index-document', {
        //     filename: req.file.filename,
        //     filepath: req.file.path,
        //     sourceId: source.id,
        //     notebookId,
        // })

        const job = await indexingQueue.add('index-document', jobData)


        return res.status(200).json({
            success: true,
            message: `${type} source added to indexing-queue`,
            jobId: job.id,
            sourceId: source.id
        })

    } catch (error) {
        console.error("Error createSource: ", error)

        return res.status(500).json({
            success: false,
            message: 'Something went wrong with source creation'
        })
    }
}