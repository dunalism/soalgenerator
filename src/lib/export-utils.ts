export interface ExportQuestion {
  id: string;
  questionText: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "MATCHING";
  options: {
    id: string;
    optionText: string;
    isCorrect: boolean;
  }[];
  answerKey: string;
}

// Helper to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Generate the complete HTML content for both printing and Word exporting
export function generateAssessmentHtml(
  questions: ExportQuestion[],
  title: string = "Lembar Soal",
): string {
  // 1. Group questions by type
  const mcQs = questions.filter((q) => q.type === "MULTIPLE_CHOICE");
  const tfQs = questions.filter((q) => q.type === "TRUE_FALSE");
  const matchQs = questions.filter((q) => q.type === "MATCHING");
  const essayQs = questions.filter((q) => q.type === "SHORT_ANSWER");

  let bodyHtml = "";
  let keyHtml = "";

  // Helper to generate the header for each section
  function getSectionHeader(
    letter: string,
    titleText: string,
    instruction: string,
  ): string {
    return `
      <div style="margin-top: 24px; margin-bottom: 16px; page-break-inside: avoid;">
        <h3 style="font-size: 12pt; font-weight: bold; margin: 0; text-transform: uppercase;">
          Bagian ${letter}: ${titleText}
        </h3>
        <p style="font-size: 12pt; font-style: italic; margin: 4px 0 0 0;">
          "${instruction}"
        </p>
      </div>
    `;
  }

  // --- BAGIAN A: PILIHAN GANDA ---
  if (mcQs.length > 0) {
    bodyHtml += getSectionHeader(
      "A",
      "Pilihan Ganda",
      "Pilihlah salah satu jawaban yang paling tepat!",
    );

    let mcContent = "";
    mcQs.forEach((q, idx) => {
      // Determine layout based on choice lengths
      const hasLongOption = q.options.some((opt) => opt.optionText.length > 27);
      let optionsRender = "";

      if (hasLongOption) {
        // Vertical layout
        optionsRender = `<div style="margin-top: 6px; padding-left: 15px;">`;
        q.options.forEach((opt, optIdx) => {
          const letter = String.fromCharCode(97 + optIdx); // a, b, c, d, e
          optionsRender += `
            <div style="margin-bottom: 4px; line-height: 1.4;">
              <span style="font-weight: normal; margin-right: 6px;">${letter}.</span>${opt.optionText}
            </div>
          `;
        });
        optionsRender += `</div>`;
      } else {
        // Two columns side-by-side: a, b, c on left, d, e on right (if 5 options) or a, b on left, c, d on right (if 4 options)
        const optsCount = q.options.length;
        const leftCount = optsCount === 5 ? 3 : 2;

        optionsRender += `
          <table style="width: 100%; border-collapse: collapse; border: none; margin-top: 6px; margin-left: 15px;">
            <tr>
              <td style="width: 50%; border: none; padding: 0; vertical-align: top;">
        `;

        // Left Column (a, b, c)
        for (let i = 0; i < leftCount; i++) {
          const letter = String.fromCharCode(97 + i);
          optionsRender += `
            <div style="margin-bottom: 4px; line-height: 1.4;">
              <span style="font-weight: normal; margin-right: 6px;">${letter}.</span>${q.options[i].optionText}
            </div>
          `;
        }

        optionsRender += `
              </td>
              <td style="width: 50%; border: none; padding: 0; vertical-align: top;">
        `;

        // Right Column (d, e)
        for (let i = leftCount; i < optsCount; i++) {
          const letter = String.fromCharCode(97 + i);
          optionsRender += `
            <div style="margin-bottom: 4px; line-height: 1.4;">
              <span style="font-weight: normal; margin-right: 6px;">${letter}.</span>${q.options[i].optionText}
            </div>
          `;
        }

        optionsRender += `
              </td>
            </tr>
          </table>
        `;
      }

      mcContent += `
        <div style="margin-bottom: 16px; page-break-inside: avoid; line-height: 1.5;">
          <table style="width: 100%; border-collapse: collapse; border: none;">
            <tr>
              <td style="width: 25px; border: none; padding: 0; vertical-align: top; font-weight: normal;">
                ${idx + 1}.
              </td>
              <td style="border: none; padding: 0; vertical-align: top;">
                ${q.questionText}
              </td>
            </tr>
          </table>
          ${optionsRender}
        </div>
      `;
    });
    bodyHtml += mcContent;

    // MC Keys
    keyHtml += `<div style="margin-bottom: 20px; page-break-inside: avoid;"><h4 style="font-size: 12pt; font-weight: bold; margin-bottom: 8px;">Kunci Jawaban Bagian A: Pilihan Ganda</h4><div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; font-size: 12pt;">`;
    mcQs.forEach((q, idx) => {
      const correctIdx = q.options.findIndex((opt) => opt.isCorrect);
      const letter =
        correctIdx !== -1 ? String.fromCharCode(97 + correctIdx) : "a";
      keyHtml += `<div style="margin-bottom: 4px;"><strong>${idx + 1}.</strong> ${letter} (${q.answerKey})</div>`;
    });
    keyHtml += `</div></div>`;
  }

  // --- BAGIAN B: BENAR/SALAH ---
  if (tfQs.length > 0) {
    bodyHtml += getSectionHeader(
      "B",
      "Benar/Salah",
      "Lingkarilah huruf B jika pernyataan benar atau S jika salah!",
    );

    let tfContent = "";
    tfQs.forEach((q, idx) => {
      tfContent += `
        <div style="margin-bottom: 14px; page-break-inside: avoid; line-height: 1.5;">
          <table style="width: 100%; border-collapse: collapse; border: none;">
            <tr>
              <td style="width: 25px; border: none; padding: 0; vertical-align: top; font-weight: normal;">
                ${idx + 1}.
              </td>
              <td style="border: none; padding: 0; vertical-align: top;">
                ${q.questionText}
              </td>
              <td style="width: 80px; border: none; padding: 0; text-align: right; vertical-align: top; font-weight: bold; font-family: 'Times New Roman', serif;">
                [ B  -  S ]
              </td>
            </tr>
          </table>
        </div>
      `;
    });
    bodyHtml += tfContent;

    // TF Keys
    keyHtml += `<div style="margin-bottom: 20px; page-break-inside: avoid;"><h4 style="font-size: 12pt; font-weight: bold; margin-bottom: 8px;">Kunci Jawaban Bagian B: Benar/Salah</h4><div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; font-size: 12pt;">`;
    tfQs.forEach((q, idx) => {
      keyHtml += `<div style="margin-bottom: 4px;"><strong>${idx + 1}.</strong> ${q.answerKey}</div>`;
    });
    keyHtml += `</div></div>`;
  }

  // --- BAGIAN C: MENJODOHKAN ---
  if (matchQs.length > 0) {
    bodyHtml += getSectionHeader(
      "C",
      "Menjodohkan",
      "Pasangkanlah pernyataan di Kolom Kiri dengan jawaban yang sesuai di Kolom Kanan!",
    );

    // Collect and shuffle responses
    const originalAnswers = matchQs.map((q) => q.answerKey);
    const shuffledAnswers = shuffleArray(originalAnswers);

    // Build side-by-side table
    let matchContent = `
      <div style="margin-bottom: 24px; page-break-inside: avoid;">
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12pt;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #000; padding: 8px; text-align: left; width: 50%; font-weight: bold;">KOLOM KIRI (PERNYATAAN)</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: left; width: 50%; font-weight: bold;">KOLOM KANAN (JAWABAN)</th>
            </tr>
          </thead>
          <tbody>
    `;

    matchQs.forEach((q, idx) => {
      const letter = String.fromCharCode(65 + idx); // A, B, C, D...
      const rightOptionText = shuffledAnswers[idx];
      matchContent += `
        <tr>
          <td style="border: 1px solid #000; padding: 10px; vertical-align: top; line-height: 1.4;">
            <span style="font-weight: normal; margin-right: 6px;">${idx + 1}.</span>${q.questionText}
          </td>
          <td style="border: 1px solid #000; padding: 10px; vertical-align: top; line-height: 1.4;">
            <span style="font-weight: bold; margin-right: 6px;">${letter}.</span>${rightOptionText}
          </td>
        </tr>
      `;
    });

    matchContent += `
          </tbody>
        </table>
      </div>
    `;
    bodyHtml += matchContent;

    // Matching Keys
    keyHtml += `<div style="margin-bottom: 20px; page-break-inside: avoid;"><h4 style="font-size: 12pt; font-weight: bold; margin-bottom: 8px;">Kunci Jawaban Bagian C: Menjodohkan</h4><div style="font-size: 12pt; line-height: 1.5;">`;
    matchQs.forEach((q, idx) => {
      // Find which letter corresponds to this q's actual answerKey
      const correctIdxInShuffled = shuffledAnswers.findIndex(
        (ans) => ans === q.answerKey,
      );
      const letter =
        correctIdxInShuffled !== -1
          ? String.fromCharCode(65 + correctIdxInShuffled)
          : "?";
      keyHtml += `<div style="margin-bottom: 4px;"><strong>No ${idx + 1}</strong> menjodohkan dengan huruf <strong>${letter}</strong> (${q.answerKey})</div>`;
    });
    keyHtml += `</div></div>`;
  }

  // --- BAGIAN D: URAIAN/ESAI ---
  if (essayQs.length > 0) {
    bodyHtml += getSectionHeader(
      "D",
      "Uraian/Esai",
      "Jawablah pertanyaan berikut dengan jelas!",
    );

    let essayContent = "";
    essayQs.forEach((q, idx) => {
      essayContent += `
        <div style="margin-bottom: 16px; page-break-inside: avoid; line-height: 1.5;">
          <table style="width: 100%; border-collapse: collapse; border: none;">
            <tr>
              <td style="width: 25px; border: none; padding: 0; vertical-align: top; font-weight: normal;">
                ${idx + 1}.
              </td>
              <td style="border: none; padding: 0; vertical-align: top;">
                ${q.questionText}
              </td>
            </tr>
          </table>
        </div>
      `;
    });
    bodyHtml += essayContent;

    // Essay Keys
    keyHtml += `<div style="margin-bottom: 20px; page-break-inside: avoid;"><h4 style="font-size: 12pt; font-weight: bold; margin-bottom: 8px;">Kunci Jawaban Bagian D: Uraian/Esai</h4><div style="font-size: 12pt; line-height: 1.5;">`;
    essayQs.forEach((q, idx) => {
      keyHtml += `
        <div style="margin-bottom: 12px;">
          <strong>No ${idx + 1}:</strong><br/>
          <div style="padding-left: 15px; margin-top: 4px; font-style: italic; color: #374151;">
            ${q.answerKey}
          </div>
        </div>
      `;
    });
    keyHtml += `</div></div>`;
  }

  // Combine document with styling
  return `
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          @page {
            size: A4;
            margin: 2cm;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            color: #000000;
            line-height: 1.5;
            padding: 0;
            margin: 0;
          }
          h1, h2, h3, h4, h5, h6 {
            font-family: 'Times New Roman', Times, serif;
            color: #000000;
          }
          .main-header {
            text-align: center;
            border-bottom: 3px double #000000;
            padding-bottom: 10px;
            margin-bottom: 24px;
          }
          .main-header h1 {
            margin: 0;
            font-size: 16pt;
            font-weight: bold;
            text-transform: uppercase;
          }
          .main-header p {
            margin: 4px 0 0 0;
            font-size: 10pt;
            font-style: italic;
          }
          .no-print-btn {
            background-color: #2563eb;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 11pt;
            cursor: pointer;
          }
          @media print {
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <!-- Print Trigger Bar (Non-Printable) -->
        <div class="no-print" style="background-color: #f3f4f6; border-bottom: 1px solid #e5e7eb; padding: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 10pt; font-weight: bold; color: #4b5563;">PREVIEW CETAK SOAL (A4)</span>
          <button class="no-print-btn" onclick="window.print()">
            Cetak Halaman / Simpan ke PDF
          </button>
        </div>

        <!-- Header Ujian -->
        <div class="main-header">
          <h1>${title}</h1>
          <p>Dibuat Otomatis Menggunakan Asisten AI SoalGenerator Pintar</p>
        </div>

        <!-- Konten Soal -->
        <div style="margin-bottom: 40px;">
          ${bodyHtml}
        </div>

        <!-- Kunci Jawaban (Halaman Baru) -->
        <div style="page-break-before: always; margin-top: 40px;">
          <div class="main-header">
            <h1>KUNCI JAWABAN</h1>
            <p>Lembar Kunci Jawaban untuk: ${title}</p>
          </div>
          <div style="margin-top: 20px;">
            ${keyHtml}
          </div>
        </div>
      </body>
    </html>
  `;
}

// Download the generated HTML as Microsoft Word format
export function downloadAsWord(
  questions: ExportQuestion[],
  title: string = "Lembar Soal",
) {
  const htmlContent = generateAssessmentHtml(questions, title);

  // Create blob with word MIME-type
  const blob = new Blob(["\ufeff" + htmlContent], {
    type: "application/msword",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  // Format file name
  const safeTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  a.download = `soal-${safeTitle || "export"}.doc`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Open the print layout in a new window
export function openPrintLayout(
  questions: ExportQuestion[],
  title: string = "Lembar Soal",
) {
  const htmlContent = generateAssessmentHtml(questions, title);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error(
      "Pop-up diblokir oleh browser. Silakan izinkan pop-up untuk mencetak.",
    );
  }
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
