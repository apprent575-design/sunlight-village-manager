import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Booking, Unit, Expense, Language } from '../types';
import { format } from 'date-fns';

// Helper: Generates a PDF from a hidden HTML element
const generatePdfFromHtml = async (htmlContent: string, fileName: string, isRTL: boolean) => {
  // 1. Create a container for the HTML
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '-9999px';
  container.style.left = isRTL ? 'auto' : '-9999px';
  container.style.right = isRTL ? '-9999px' : 'auto';
  container.style.width = '794px'; // A4 width at 96 DPI (approx)
  container.style.minHeight = '1123px'; // A4 height
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#000000';
  container.style.fontFamily = "'Cairo', sans-serif";
  container.style.direction = isRTL ? 'rtl' : 'ltr';
  container.innerHTML = htmlContent;

  document.body.appendChild(container);

  try {
    // 2. Wait longer for DOM/Tailwind to settle (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Capture with html2canvas
    const canvas = await html2canvas(container, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // 4. Generate PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    pdf.save(fileName);

  } catch (error) {
    console.error("PDF Generation failed:", error);
    alert("Could not generate PDF. Please try again.");
  } finally {
    // 5. Cleanup
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};

export const generateReceipt = async (booking: Booking, unitName: string, lang: Language, t: any) => {
  const isRTL = lang === 'ar';
  const nightlyBase = booking.nightly_rate || 0;
  const villageFee = booking.village_fee || 0;
  const dailyTotal = nightlyBase + villageFee;
  
  const html = `
    <div class="p-12 font-sans" dir="${isRTL ? 'rtl' : 'ltr'}">
      <div class="text-center mb-10 border-b-2 border-primary-100 pb-8">
        <h1 class="text-4xl font-extrabold text-primary-600 mb-2">Sunlight Village</h1>
        <h2 class="text-2xl text-gray-600 font-semibold">${isRTL ? "فاتورة حجز" : "Booking Receipt"}</h2>
        <p class="text-sm text-gray-400 mt-2">Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
      </div>

      <div class="mb-10">
        <div class="grid grid-cols-2 gap-6 text-sm mb-4">
           <div class="p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <span class="block text-gray-500 text-xs uppercase tracking-wider mb-2">${t('tenant')}</span>
              <span class="block text-xl font-bold text-gray-900 mb-1">${booking.tenant_name}</span>
              <span class="block text-gray-600 text-lg" style="direction: ltr">+20 ${booking.phone}</span>
           </div>
           <div class="p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <span class="block text-gray-500 text-xs uppercase tracking-wider mb-2">${t('unit')}</span>
              <span class="block text-xl font-bold text-gray-900">${unitName}</span>
           </div>
        </div>
      </div>

      <div class="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden mb-8">
        <table class="w-full text-left">
          <thead class="bg-gray-50 text-gray-700">
            <tr>
              <th class="p-5 text-sm font-bold uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}">${t('details')}</th>
              <th class="p-5 text-sm font-bold uppercase tracking-wider ${isRTL ? 'text-left' : 'text-right'}">${t('amount')}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr>
              <td class="p-5 ${isRTL ? 'text-right' : 'text-left'}">
                <span class="font-bold block text-gray-800 text-lg mb-1">${t('dates')}</span>
                <span class="text-sm text-gray-500">${format(new Date(booking.start_date), 'yyyy-MM-dd')} &rarr; ${format(new Date(booking.end_date), 'yyyy-MM-dd')}</span>
              </td>
              <td class="p-5 font-mono font-medium text-lg text-gray-700 ${isRTL ? 'text-left' : 'text-right'}">
                ${booking.nights} ${t('nights')}
              </td>
            </tr>
            <tr>
              <td class="p-5 ${isRTL ? 'text-right' : 'text-left'}">
                 <span class="block font-medium text-gray-600">${t('nightlyRate')} (Base)</span>
              </td>
              <td class="p-5 font-mono text-gray-600 ${isRTL ? 'text-left' : 'text-right'}">
                 ${nightlyBase} ${t('currency')}
              </td>
            </tr>
            <tr>
              <td class="p-5 ${isRTL ? 'text-right' : 'text-left'}">
                 <span class="block font-medium text-gray-600">${t('villageFee')} (Daily)</span>
              </td>
              <td class="p-5 font-mono text-gray-600 ${isRTL ? 'text-left' : 'text-right'}">
                 ${villageFee} ${t('currency')}
              </td>
            </tr>
             <tr class="bg-blue-50/30">
              <td class="p-5 ${isRTL ? 'text-right' : 'text-left'} font-bold text-blue-800">
                 ${t('dailyTotal')}
              </td>
              <td class="p-5 font-mono font-bold text-blue-800 ${isRTL ? 'text-left' : 'text-right'}">
                 ${dailyTotal} ${t('currency')}
              </td>
            </tr>

            ${booking.housekeeping_enabled ? `
            <tr>
              <td class="p-5 ${isRTL ? 'text-right' : 'text-left'} font-bold text-gray-700">${t('housekeeping')}</td>
              <td class="p-5 font-mono font-medium text-gray-700 ${isRTL ? 'text-left' : 'text-right'}">${booking.housekeeping_price} ${t('currency')}</td>
            </tr>
            ` : ''}
          </tbody>
          <tfoot class="bg-gray-900 text-white">
            <tr>
              <td class="p-6 text-xl font-bold ${isRTL ? 'text-right' : 'text-left'}">${t('grandTotal')}</td>
              <td class="p-6 text-2xl font-bold ${isRTL ? 'text-left' : 'text-right'}">${booking.total_rental_price} ${t('currency')}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      ${booking.deposit_enabled ? `
        <div class="mb-8 p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800 flex justify-between items-center">
            <div>
                <span class="font-bold block">${t('deposit')}</span>
                <span class="text-xs opacity-75">(Refundable Hold)</span>
            </div>
            <span class="font-mono font-bold text-xl">${booking.deposit_amount} ${t('currency')}</span>
        </div>
        ` : ''}

      <div class="mt-16 text-center border-t border-gray-100 pt-8">
        <p class="text-gray-400 text-sm mb-2">Thank you for choosing Sunlight Village</p>
        <div class="inline-block px-6 py-2 rounded-full bg-green-100 text-green-700 text-sm font-bold uppercase tracking-widest">
           ${booking.status}
        </div>
      </div>
    </div>
  `;

  await generatePdfFromHtml(html, `Receipt_${booking.tenant_name.replace(/\s+/g, '_')}_${booking.id.substring(0,4)}.pdf`, isRTL);
};

export const generateExpenseReport = async (expenses: Expense[], units: Unit[], lang: Language, t: any) => {
  const isRTL = lang === 'ar';
  
  let rowsHtml = '';
  let grandTotal = 0;

  for (const unit of units) {
    const unitExpenses = expenses.filter(e => e.unit_id === unit.id);
    if (unitExpenses.length === 0) continue;

    const unitTotal = unitExpenses.reduce((sum, e) => sum + e.amount, 0);
    grandTotal += unitTotal;

    rowsHtml += `
      <tr class="bg-gray-100">
        <td colspan="3" class="p-4 font-bold text-gray-800 ${isRTL ? 'text-right' : 'text-left'}">${t('unit')}: ${unit.name}</td>
      </tr>
    `;

    unitExpenses.forEach(e => {
      rowsHtml += `
        <tr class="border-b border-gray-100">
          <td class="p-4 text-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}">${format(new Date(e.date), 'yyyy-MM-dd')}</td>
          <td class="p-4 text-sm font-medium text-gray-800 ${isRTL ? 'text-right' : 'text-left'}">
            ${e.title}
            <span class="text-xs text-gray-400 block mt-1">${e.category}</span>
          </td>
          <td class="p-4 text-sm font-mono text-red-600 font-bold ${isRTL ? 'text-left' : 'text-right'}">${e.amount} ${t('currency')}</td>
        </tr>
      `;
    });

    rowsHtml += `
      <tr>
        <td colspan="2" class="p-4 text-sm font-bold text-gray-500 uppercase tracking-wider ${isRTL ? 'text-left' : 'text-right'}">${t('subtotal')}</td>
        <td class="p-4 text-sm font-bold text-gray-900 ${isRTL ? 'text-left' : 'text-right'}">${unitTotal} ${t('currency')}</td>
      </tr>
    `;
  }

  const html = `
    <div class="p-12 font-sans" dir="${isRTL ? 'rtl' : 'ltr'}">
      <div class="flex justify-between items-center mb-10 border-b-2 border-gray-200 pb-8">
        <div>
          <h1 class="text-3xl font-extrabold text-gray-900">Sunlight Village</h1>
          <h2 class="text-xl text-gray-500 mt-1">${isRTL ? "تقرير المصروفات" : "Expense Report"}</h2>
        </div>
        <div class="text-right">
          <p class="text-sm text-gray-400 font-medium">${format(new Date(), 'yyyy-MM-dd')}</p>
        </div>
      </div>

      <div class="bg-white rounded-xl overflow-hidden mb-8 border border-gray-200">
        <table class="w-full">
          <thead class="bg-gray-800 text-white">
            <tr>
              <th class="p-4 text-xs uppercase tracking-wider font-bold ${isRTL ? 'text-right' : 'text-left'}">${t('date')}</th>
              <th class="p-4 text-xs uppercase tracking-wider font-bold ${isRTL ? 'text-right' : 'text-left'}">${t('details')}</th>
              <th class="p-4 text-xs uppercase tracking-wider font-bold ${isRTL ? 'text-left' : 'text-right'}">${t('amount')}</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot class="bg-gray-50 border-t-2 border-gray-200">
             <tr>
               <td colspan="2" class="p-6 text-xl font-bold text-gray-800 ${isRTL ? 'text-left' : 'text-right'}">${t('total')}</td>
               <td class="p-6 text-xl font-bold text-red-600 ${isRTL ? 'text-left' : 'text-right'}">${grandTotal} ${t('currency')}</td>
             </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;

  await generatePdfFromHtml(html, `Expense_Report_${format(new Date(), 'yyyyMMdd')}.pdf`, isRTL);
};

export const generateFinancialReport = async (bookings: Booking[], expenses: Expense[], lang: Language, t: any) => {
    const isRTL = lang === 'ar';
    
    // Calculate totals
    const totalRentalRevenue = bookings
      .filter(b => b.status === 'Confirmed')
      .reduce((sum, b) => sum + (b.nightly_rate * b.nights), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRentalRevenue - totalExpenses;
  
    const html = `
      <div class="p-12 font-sans" dir="${isRTL ? 'rtl' : 'ltr'}">
        <div class="text-center mb-12 border-b-2 border-primary-100 pb-8">
          <h1 class="text-4xl font-extrabold text-primary-600 mb-2">Sunlight Village</h1>
          <h2 class="text-2xl text-gray-600 font-semibold">${isRTL ? "الملخص المالي" : "Financial Summary"}</h2>
          <p class="text-sm text-gray-400 mt-2">Generated: ${format(new Date(), 'yyyy-MM-dd')}</p>
        </div>
  
        <div class="grid grid-cols-2 gap-8 mb-12">
            <div class="p-8 bg-green-50 rounded-2xl border border-green-100 text-center">
                <h3 className="text-gray-500 font-bold uppercase tracking-wider text-sm mb-2">Total Rental Revenue</h3>
                <p className="text-4xl font-bold text-green-700">${totalRentalRevenue.toLocaleString()} ${t('currency')}</p>
                <p className="text-xs text-green-600 mt-2">Based on Confirmed bookings only (Base Rates)</p>
            </div>
            <div class="p-8 bg-red-50 rounded-2xl border border-red-100 text-center">
                <h3 className="text-gray-500 font-bold uppercase tracking-wider text-sm mb-2">Total Expenses</h3>
                <p className="text-4xl font-bold text-red-700">${totalExpenses.toLocaleString()} ${t('currency')}</p>
            </div>
        </div>
  
        <div class="p-10 bg-gray-900 rounded-3xl text-center text-white shadow-xl">
             <h3 className="text-gray-400 font-bold uppercase tracking-wider text-sm mb-4">Net Profit</h3>
             <p className="text-6xl font-bold text-white">${netProfit.toLocaleString()} ${t('currency')}</p>
        </div>
      </div>
    `;
  
    await generatePdfFromHtml(html, `Financial_Summary_${format(new Date(), 'yyyyMMdd')}.pdf`, isRTL);
};

export const generateOccupancyReport = async (units: Unit[], bookings: Booking[], lang: Language, t: any) => {
    const isRTL = lang === 'ar';
    
    let rowsHtml = '';
    
    units.forEach(unit => {
        const unitBookings = bookings.filter(b => b.unit_id === unit.id).sort((a,b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
        const totalNights = unitBookings.reduce((sum, b) => sum + b.nights, 0);

        rowsHtml += `
            <tr class="bg-gray-100">
               <td colspan="4" class="p-4 font-bold text-gray-800 ${isRTL ? 'text-right' : 'text-left'}">
                  ${unit.name} <span class="text-xs font-normal text-gray-500">(${unit.type})</span> - <span class="text-blue-600">${totalNights} Nights Booked</span>
               </td>
            </tr>
        `;

        if (unitBookings.length === 0) {
             rowsHtml += `<tr><td colspan="4" class="p-4 text-center text-gray-400 text-sm">No history</td></tr>`;
        }

        unitBookings.forEach(b => {
             rowsHtml += `
                <tr class="border-b border-gray-100">
                   <td class="p-4 text-sm text-gray-700 ${isRTL ? 'text-right' : 'text-left'}">${b.tenant_name}</td>
                   <td class="p-4 text-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}">${format(new Date(b.start_date), 'yyyy-MM-dd')} &rarr; ${format(new Date(b.end_date), 'yyyy-MM-dd')}</td>
                   <td class="p-4 text-sm font-mono text-gray-600 ${isRTL ? 'text-right' : 'text-left'}">${b.nights} Nights</td>
                   <td class="p-4 text-xs font-bold uppercase ${isRTL ? 'text-left' : 'text-right'}">
                      <span class="${b.status === 'Confirmed' ? 'text-green-600' : 'text-yellow-600'}">${b.status}</span>
                   </td>
                </tr>
             `;
        });
    });

    const html = `
      <div class="p-12 font-sans" dir="${isRTL ? 'rtl' : 'ltr'}">
        <div class="text-center mb-10 border-b-2 border-primary-100 pb-8">
          <h1 class="text-3xl font-extrabold text-primary-600 mb-2">Sunlight Village</h1>
          <h2 class="text-2xl text-gray-600 font-semibold">${isRTL ? "تقرير الإشغال" : "Occupancy Report"}</h2>
          <p class="text-sm text-gray-400 mt-2">Generated: ${format(new Date(), 'yyyy-MM-dd')}</p>
        </div>
  
        <div class="bg-white rounded-xl overflow-hidden mb-8 border border-gray-200">
          <table class="w-full">
            <thead class="bg-gray-800 text-white">
              <tr>
                <th class="p-4 text-xs uppercase tracking-wider font-bold ${isRTL ? 'text-right' : 'text-left'}">${t('tenant')}</th>
                <th class="p-4 text-xs uppercase tracking-wider font-bold ${isRTL ? 'text-right' : 'text-left'}">${t('dates')}</th>
                <th class="p-4 text-xs uppercase tracking-wider font-bold ${isRTL ? 'text-right' : 'text-left'}">Duration</th>
                <th class="p-4 text-xs uppercase tracking-wider font-bold ${isRTL ? 'text-left' : 'text-right'}">${t('status')}</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;
  
    await generatePdfFromHtml(html, `Occupancy_Report_${format(new Date(), 'yyyyMMdd')}.pdf`, isRTL);
};