```
XLOOKUP(1, (('PLM export'!$E$2:$E$5000=B12)*('PLM export'!$H$2:$H$5000="Outer 1")), 'PLM export'!$AK$2:$AK$5000,
```
1. **Multi-Criteria Conditions**:
    
    - The formula here uses a multiplication of two conditions: `('PLM export'!$E$2:$E$5000=B12)` and `('PLM export'!$H$2:$H$5000="Outer 1")`.
    - In Excel, when you multiply boolean arrays like this, it implicitly converts `TRUE` and `FALSE` to `1` and `0`, respectively, and performs an element-wise multiplication.
    - This means the formula checks two conditions simultaneously. Only those rows where both conditions are true will result in `1`.
2. **Boolean Lookup**:
    
    - The `1` in the XLOOKUP is used as the lookup value. The result of multiplying the two conditions will yield a series of 0s and a 1 when both conditions are met. The XLOOKUP is effectively finding this `1`.

Would also be able to use this with just one criteria. Super powerful