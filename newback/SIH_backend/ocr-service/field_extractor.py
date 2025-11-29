import re
from datetime import datetime
from typing import Dict, Optional, List, Tuple
from rapidfuzz import fuzz, process
from dateutil import parser as date_parser
import logging

logger = logging.getLogger(__name__)


class FieldExtractor:
    """Smart field extraction from OCR text with fuzzy matching"""
    
    # Known biller patterns
    KNOWN_BILLERS = {
        'ELECTRICITY': [
            'electricity board', 'power distribution', 'electric company',
            'msedcl', 'bescom', 'tata power', 'adani electricity',
            'torrent power', 'cesc', 'bses', 'reliance energy'
        ],
        'WATER': [
            'water supply', 'water board', 'municipal corporation',
            'jal board', 'water works', 'water department'
        ],
        'MOBILE': [
            'airtel', 'vodafone', 'jio', 'bsnl', 'idea',
            'mobile', 'telecom', 'cellular'
        ],
        'GAS': [
            'gas company', 'indraprastha gas', 'mahanagar gas',
            'gujarat gas', 'lpg', 'png'
        ]
    }
    
    # Field keywords for fuzzy matching
    FIELD_KEYWORDS = {
        'amount': ['amount', 'total', 'bill amount', 'payable', 'due amount', 'total amount'],
        'bill_number': ['bill no', 'bill number', 'invoice no', 'invoice number', 'reference no'],
        'consumer_number': ['consumer no', 'consumer number', 'customer id', 'account no', 'ca number'],
        'due_date': ['due date', 'payment due', 'last date', 'pay by'],
        'billing_date': ['bill date', 'billing date', 'invoice date', 'date of issue'],
        'units': ['units consumed', 'consumption', 'kwh', 'units', 'usage']
    }
    
    def __init__(self, confidence_threshold: float = 0.6):
        self.confidence_threshold = confidence_threshold
    
    def extract_fields(self, text: str) -> Dict:
        """Extract all fields from OCR text"""
        logger.info("Starting field extraction from OCR text")
        
        lines = text.split('\n')
        
        result = {
            'amount': self._extract_amount(text, lines),
            'bill_number': self._extract_bill_number(text, lines),
            'consumer_number': self._extract_consumer_number(text, lines),
            'biller_info': self._extract_biller_info(text),
            'billing_date': self._extract_billing_date(text, lines),
            'due_date': self._extract_due_date(text, lines),
            'units_consumed': self._extract_units(text, lines),
            'raw_text': text[:500]  # First 500 chars for debugging
        }
        
        logger.info(f"Extraction complete: {result}")
        return result
    
    def _extract_amount(self, text: str, lines: List[str]) -> Dict:
        """Extract amount with confidence score"""
        # Patterns for Indian currency
        patterns = [
            r'(?:total\s+amount\s+payable)[\s:]*(?:rs\.?|₹|inr)?\s*(\d+(?:,\d+)*(?:\.\d{2})?)',  # Total Amount Payable ₹1,065.00
            r'(?:rs\.?|₹|inr)\s*(\d+(?:,\d+)*(?:\.\d{2})?)',  # Rs. 1,234.56 or ₹1,234.56
            r'(\d+(?:,\d+)*(?:\.\d{2})?)\s*(?:rs\.?|₹|inr)',  # 1,234.56 Rs
            r'(?:total|amount|payable)[\s:]*(?:rs\.?|₹|inr)?\s*(\d+(?:,\d+)*(?:\.\d{2})?)',
        ]
        
        amounts = []
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                amount_str = match.group(1).replace(',', '')
                try:
                    amount = float(amount_str)
                    if 0 < amount < 1000000:  # Reasonable range
                        amounts.append(amount)
                except ValueError:
                    continue
        
        if amounts:
            # Take the maximum amount (usually the total)
            amount = max(amounts)
            return {'value': amount, 'confidence': 0.85}
        
        return {'value': None, 'confidence': 0.0}
    
    def _extract_bill_number(self, text: str, lines: List[str]) -> Dict:
        """Extract bill number using fuzzy matching"""
        return self._extract_field_with_fuzzy_match(
            lines, 
            self.FIELD_KEYWORDS['bill_number'],
            r'([A-Z0-9\-/]+)',
            min_length=5
        )
    
    def _extract_consumer_number(self, text: str, lines: List[str]) -> Dict:
        """Extract consumer number using fuzzy matching"""
        return self._extract_field_with_fuzzy_match(
            lines,
            self.FIELD_KEYWORDS['consumer_number'],
            r'(\d{6,15})',  # Pure numeric, 6-15 digits
            min_length=6
        )
    
    def _extract_biller_info(self, text: str) -> Dict:
        """Identify biller name and category"""
        text_lower = text.lower()
        
        best_match = None
        best_score = 0
        best_category = None
        
        for category, billers in self.KNOWN_BILLERS.items():
            for biller in billers:
                score = fuzz.partial_ratio(biller, text_lower)
                if score > best_score:
                    best_score = score
                    best_match = biller
                    best_category = category
        
        if best_score > 60:
            return {
                'biller_name': best_match.upper(),
                'category': best_category,
                'confidence': best_score / 100.0
            }
        
        return {
            'biller_name': None,
            'category': 'UNKNOWN',
            'confidence': 0.0
        }
    
    def _extract_billing_date(self, text: str, lines: List[str]) -> Dict:
        """Extract billing date"""
        return self._extract_date_field(lines, self.FIELD_KEYWORDS['billing_date'])
    
    def _extract_due_date(self, text: str, lines: List[str]) -> Dict:
        """Extract due date"""
        return self._extract_date_field(lines, self.FIELD_KEYWORDS['due_date'])
    
    def _extract_units(self, text: str, lines: List[str]) -> Dict:
        """Extract units consumed"""
        result = self._extract_field_with_fuzzy_match(
            lines,
            self.FIELD_KEYWORDS['units'],
            r'(\d+(?:\.\d+)?)',
            min_length=1
        )
        
        if result['value']:
            try:
                result['value'] = float(result['value'])
            except ValueError:
                result['value'] = None
                result['confidence'] = 0.0
        
        return result
    
    def _extract_field_with_fuzzy_match(
        self, 
        lines: List[str], 
        keywords: List[str],
        value_pattern: str,
        min_length: int = 1
    ) -> Dict:
        """Generic field extraction with fuzzy keyword matching"""
        
        for line in lines:
            line_clean = line.strip()
            if not line_clean:
                continue
            
            # Check if line contains any keyword with fuzzy matching
            best_match = process.extractOne(line_clean.lower(), keywords, scorer=fuzz.partial_ratio)
            
            if best_match and best_match[1] > 70:  # 70% match threshold
                # Extract value after the keyword
                parts = re.split(r'[:=\-\s]+', line_clean, maxsplit=1)
                if len(parts) > 1:
                    value_match = re.search(value_pattern, parts[1])
                    if value_match:
                        value = value_match.group(1).strip()
                        if len(value) >= min_length:
                            return {
                                'value': value,
                                'confidence': best_match[1] / 100.0
                            }
        
        return {'value': None, 'confidence': 0.0}
    
    def _extract_date_field(self, lines: List[str], keywords: List[str]) -> Dict:
        """Extract date field with fuzzy matching"""
        
        for line in lines:
            line_clean = line.strip()
            if not line_clean:
                continue
            
            # Check if line contains date keyword
            best_match = process.extractOne(line_clean.lower(), keywords, scorer=fuzz.partial_ratio)
            
            if best_match and best_match[1] > 70:
                # Try to parse date from the line
                parts = re.split(r'[:=\-\s]+', line_clean, maxsplit=1)
                if len(parts) > 1:
                    date_str = parts[1].strip()
                    parsed_date = self._parse_date(date_str)
                    if parsed_date:
                        return {
                            'value': parsed_date.strftime('%Y-%m-%d'),
                            'confidence': best_match[1] / 100.0
                        }
        
        return {'value': None, 'confidence': 0.0}
    
    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse date from various formats"""
        try:
            # Try dateutil parser (handles many formats)
            return date_parser.parse(date_str, fuzzy=True)
        except Exception:
            # Try common Indian date formats
            formats = [
                '%d/%m/%Y', '%d-%m-%Y', '%d.%m.%Y',
                '%d/%m/%y', '%d-%m-%y',
                '%Y-%m-%d', '%Y/%m/%d',
                '%d %b %Y', '%d %B %Y'
            ]
            
            for fmt in formats:
                try:
                    return datetime.strptime(date_str.strip(), fmt)
                except ValueError:
                    continue
        
        return None
