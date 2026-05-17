const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ImageRun, AlignmentType, BorderStyle, PageBreak } = require("docx");
const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size').imageSize || require('image-size');

class WordService {
    async exportReceiptsWord(expenses) {
        const children = [];

        let photoCount = 0;

        for (const exp of expenses) {
            let imagePaths = [];
            try {
                if (exp.image_path) {
                    if (exp.image_path.startsWith('[')) {
                        imagePaths = JSON.parse(exp.image_path);
                    } else {
                        imagePaths = [exp.image_path];
                    }
                }
            } catch (e) {
                console.error("Error parsing image path:", e);
            }

            // 1. Skip if no images
            if (!imagePaths || imagePaths.length === 0) {
                continue;
            }

            // Iterate through all images for this expense
            for (let i = 0; i < imagePaths.length; i++) {
                const imgRelativePath = imagePaths[i];
                const cleanPath = imgRelativePath.startsWith('/') ? imgRelativePath.substring(1) : imgRelativePath;
                const fullPath = path.resolve(__dirname, '..', cleanPath);
                
                if (!fs.existsSync(fullPath)) {
                    continue;
                }

                try {
                    const imageBuffer = fs.readFileSync(fullPath);
                    const dimensions = sizeOf(imageBuffer);
                    
                    // Scale to fit page (max width 550px, max height 400px)
                    const maxWidthPx = 550;
                    const maxHeightPx = 400;
                    let finalWidthPx = dimensions.width;
                    let finalHeightPx = dimensions.height;
                    
                    if (finalWidthPx > maxWidthPx) {
                        const ratio = maxWidthPx / finalWidthPx;
                        finalWidthPx = maxWidthPx;
                        finalHeightPx = finalHeightPx * ratio;
                    }
                    if (finalHeightPx > maxHeightPx) {
                        const ratio = maxHeightPx / finalHeightPx;
                        finalHeightPx = maxHeightPx;
                        finalWidthPx = finalWidthPx * ratio;
                    }

                    const ext = path.extname(fullPath).toLowerCase().substring(1);
                    const imageType = ext === 'jpeg' ? 'jpg' : ext;

                    // 2. Prepare Header Text (e.g. SN #58 or SN #58-1)
                    const suffix = imagePaths.length > 1 ? `-${i + 1}` : '';
                    const sn = `SN #${exp.id}${suffix}`;
                    const store = exp.supplier_name || 'Unknown Store';
                    const amount = `$${(exp.outgoing || 0).toLocaleString()}`;
                    const date = exp.invoice_date || '';

                    const headerPara = new Paragraph({
                        children: [
                            new TextRun({ text: `${sn} - ${store} `, bold: true, size: 24 }),
                            new TextRun({ text: `(${amount})`, color: "FF0000", bold: true, size: 24 }),
                            new TextRun({ text: ` (${date})`, bold: true, size: 24 }),
                        ],
                        spacing: { before: 100, after: 100 },
                    });

                    // 3. Prepare Image Paragraph
                    const imagePara = new Paragraph({
                        children: [
                            new ImageRun({
                                data: imageBuffer,
                                type: imageType,
                                transformation: {
                                    width: Math.round(finalWidthPx),
                                    height: Math.round(finalHeightPx),
                                },
                            }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200, after: 200 }
                    });

                    // 4. Create Table for this specific image
                    const table = new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                cantSplit: true, // Prevent header from separating from image
                                children: [
                                    new TableCell({
                                        children: [headerPara],
                                        padding: { left: 100, right: 100 },
                                        borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" } }
                                    })
                                ]
                            }),
                            new TableRow({
                                cantSplit: true,
                                children: [
                                    new TableCell({
                                        children: [imagePara],
                                        padding: { top: 200, bottom: 200 }
                                    })
                                ]
                            })
                        ],
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
                        }
                    });

                    children.push(table);
                    photoCount++;

                    // 5. Enforce 2 per page
                    if (photoCount % 2 === 0) {
                        children.push(new Paragraph({ children: [new PageBreak()] }));
                    } else {
                        children.push(new Paragraph({ text: "", spacing: { after: 300 } })); // Spacer between the 2 photos
                    }

                } catch (err) {
                    console.error("Error processing image:", fullPath, err);
                }
            }
        }

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 720, // 0.5 inch (narrow margin)
                            bottom: 720,
                            left: 720,
                            right: 720,
                        },
                    },
                },
                children: children,
            }],
        });

        const buffer = await Packer.toBuffer(doc);

        // Word strictly requires unique docPr IDs for images. 
        // The docx library has a known issue where it always assigns id="1" to ImageRun.
        // We post-process the docx (which is a ZIP) to fix the XML IDs.
        try {
            const AdmZip = require('adm-zip');
            const zip = new AdmZip(buffer);
            const documentXmlEntry = zip.getEntries().find(e => e.entryName === 'word/document.xml');
            
            if (documentXmlEntry) {
                let xml = documentXmlEntry.getData().toString('utf8');
                let idCounter = 1;
                // Replace all `<wp:docPr id="1"` (or whatever digit it gave) with incremental IDs
                xml = xml.replace(/<wp:docPr id="\d+"/g, () => `<wp:docPr id="${idCounter++}"`);
                
                zip.updateFile('word/document.xml', Buffer.from(xml, 'utf8'));
                return zip.toBuffer();
            }
        } catch (postErr) {
            console.error('[WordService] Post-processing failed:', postErr);
            // Fallback to original buffer if something goes wrong
        }

        return buffer;
    }
}

module.exports = new WordService();
