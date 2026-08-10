import { prisma } from '../../config/prisma.js'
import { deleteVectorsBySource } from '../../services/qdrant.js';
import { indexingQueue } from '../queue/indexing.queue.js';
import { getAuth } from '@clerk/express'


export async function createSource(req, res) {
  try {
    const { notebookId } = req.params
    const { type, name, originalPath } = req.body
    const { userId } = getAuth(req)

    if (!type || !name) {
      return res.status(400).json({ success: false, message: "type and name required" });
    }
    if (!userId) {
      return res.status(401).json({ success: false, message: "unauthorized" });
    }

    const notebook = await prisma.notebook.findFirst({ where: { id: notebookId, userId } });
    if (!notebook) {
      return res.status(404).json({ success: false, message: "Notebook not found" });
    }

    const source = await prisma.source.create({
      data: {
        notebookId,
        type,
        name,
        originalPath,
        status: "UPLOADING"
      }
    })

    res.json(source)

  } catch (error) {
    console.log("Error in createSource: ", error)
    res.status(500).json({ success: false, message: "something went wrong in createSource" })
  }
}

export async function listSources(req, res) {
  try {
    const { notebookId } = req.params;
    const { userId } = getAuth(req)

    if (!userId) {
      return res.status(401).json({ success: false, message: "unauthorized" });
    }

    const notebook = await prisma.notebook.findFirst({ where: { id: notebookId, userId } });
    if (!notebook) {
      return res.status(404).json({ success: false, message: "Notebook not found" });
    }

    const sources = await prisma.source.findMany({
      where: { notebookId },
      orderBy: { createdAt: "desc" },
    });
    res.json(sources);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "something went wrong" });
  }
}

export async function deleteSource(req, res) {
  try {
    const { id } = req.params;
    const { userId } = getAuth(req)

    if (!userId) {
      return res.status(401).json({ success: false, message: "unauthorized" });
    }

    const source = await prisma.source.findUnique({ 
        where: { id },
        include: { notebook: true }
    });

    if (!source || source.notebook.userId !== userId) {
      return res.status(404).json({ success: false, message: "Source not found" });
    }

    await deleteVectorsBySource(id)
    // await prisma.source.delete({ where: { id } })
    try {
      await prisma.source.delete({ where: { id } });
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ success: false, message: "Source already deleted" })
      }
      throw err
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "something went wrong" });
  }
}


export async function reindexSource(req, res) {
  try {
    const { id } = req.params
    const { userId } = getAuth(req)

    if (!userId) {
      return res.status(401).json({ success: false, message: "unauthorized" });
    }

    const source = await prisma.source.findUnique({ 
        where: { id },
        include: { notebook: true }
    })
    if (!source || source.notebook.userId !== userId) {
      return res.status(404).json({ success: false, message: "Source not found" });
    }

    await deleteVectorsBySource(id)

    const jobData = {
      sourceId: source.id,
      notebookId: source.notebookId,
      type: source.type
    }


    switch (source.type) {
      case 'PDF':
      case 'VTT':
        if (!source.originalPath) {
          return res.status(400).json({ success: false, message: 'No file path stored for this source, cannot reindex' })
        }
        jobData.filepath = source.originalPath
        break

      case 'TEXT':
        if (!source.content) {
          return res.status(400).json({ success: false, message: 'No content stored for this source, cannot reindex' })
        }
        jobData.content = source.content
        break;

      case "URL":
      case "YOUTUBE":
        if (!source.sourceUrl) {
          return res.status(400).json({ success: false, message: "No URL stored for this source, cannot reindex" })
        }
        jobData.url = source.sourceUrl
        break
    }


    await prisma.source.update({
      where: { id },
      data: { status: "UPLOADING", errorMessage: null }
    })

    const job = await indexingQueue.add('index-document', jobData)

    res.json({ success: true, message: "Reindex job queued", jobId: job.id })

  } catch (error) {
    console.log("Error in reindexSource: ", error)
    res.status(500).json({ success: false, message: "something went wrong" });
  }
}