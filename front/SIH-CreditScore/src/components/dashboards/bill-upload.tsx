'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, UploadCloud, FileJson, IndianRupee } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { billParser, type BillParserOutput } from '@/ai/flows/bill-parser';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/contexts/language-context';

export default function BillUpload({ onBillConfirmed }: { onBillConfirmed: (bill: BillParserOutput) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<BillParserOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 4 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please upload an image smaller than 4MB.',
        });
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setParsedData(null);
      setError(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const handleSubmit = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please select a bill image to upload.',
      });
      return;
    }
    if (!consent) {
      toast({
        variant: 'destructive',
        title: 'Consent not given',
        description: 'Please agree to the terms to proceed.',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setParsedData(null);
    
    try {
      const photoDataUri = await fileToDataUri(file);
      const result = await billParser({ photoDataUri });
      setParsedData(result);
      toast({
        title: 'Bill Parsed Successfully',
        description: 'The AI has extracted the information from your bill.',
      });
    } catch (e: any) {
      console.error(e);
      setError('Failed to parse the bill. The AI could not read the document. Please try a clearer image.');
      toast({
        variant: 'destructive',
        title: 'Parsing Failed',
        description: 'The AI could not read the document. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = (clearAll: boolean = false) => {
      if (clearAll) {
        setFile(null);
        setPreviewUrl(null);
        setConsent(false);
      }
      setParsedData(null);
      setError(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  }

  const handleConfirm = () => {
    if (!parsedData) return;
    onBillConfirmed(parsedData);
    toast({
        title: "Bill Saved!",
        description: "The bill has been added to your profile."
    });
    handleReset(true);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('upload_your_bill')}</CardTitle>
          <CardDescription>
            {t('upload_bill_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
          />
          
          {!previewUrl ? (
            <div
              onClick={handleUploadClick}
              className="flex flex-col items-center justify-center space-y-2 border-2 border-dashed border-muted-foreground/50 rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
            >
              <UploadCloud className="h-12 w-12 text-muted-foreground" />
              <p className="font-semibold">{t('click_to_upload')}</p>
              <p className="text-sm text-muted-foreground">{t('file_specs')}</p>
            </div>
          ) : (
             <div className="relative w-full max-w-sm mx-auto">
               <Image src={previewUrl} alt="Bill preview" width={400} height={600} className="rounded-lg object-contain" />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox id="terms" checked={consent} onCheckedChange={(checked) => setConsent(checked as boolean)} />
            <Label htmlFor="terms" className="text-sm text-muted-foreground">
              {t('consent_text')}
            </Label>
          </div>
          
          <div className="flex gap-4">
            <Button onClick={handleSubmit} disabled={isLoading || !file || !consent}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('parsing_bill')}</>
              ) : t('parse_bill')}
            </Button>
            { (file || parsedData || error) && <Button variant="outline" onClick={() => handleReset(true)}>{t('reset')}</Button> }
          </div>
          
        </CardContent>
      </Card>
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {parsedData && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><FileJson className="mr-2 h-5 w-5"/> {t('parsed_bill_data')}</CardTitle>
                <CardDescription>{t('verify_parsed_data')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <p><strong>{t('vendor')}:</strong> {parsedData.vendorName}</p>
                    <p><strong>{t('date')}:</strong> {parsedData.transactionDate}</p>
                    <p><strong>{t('total_amount')}:</strong> <IndianRupee className="inline h-4 w-4" />{parsedData.totalAmount}</p>
                    <p><strong>{t('category')}:</strong> {parsedData.category}</p>
                </div>
                <h4 className="font-semibold mt-4 mb-2">{t('line_items')}</h4>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {parsedData.lineItems.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{item.description}</TableCell>
                                <TableCell className="text-right"><IndianRupee className="inline h-4 w-4" />{item.amount}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 <div className="flex justify-end mt-4 gap-2">
                    <Button variant="outline" onClick={() => handleReset(false)}>{t('re_scan')}</Button>
                    <Button onClick={handleConfirm}>{t('confirm_and_add')}</Button>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
