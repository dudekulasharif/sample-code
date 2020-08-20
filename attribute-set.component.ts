import { NotificationService } from '@shared/services/notification.service';
import {
  Component,
  OnInit,
  Input,
  EventEmitter,
  Output,
  OnDestroy,
  SimpleChanges,
  OnChanges,
  SimpleChange,
} from '@angular/core';
import { TranslationAttributes } from '@admin/models/translations.model';
import { AdminService } from '@admin/services/admin.service';
import { TranslationService, Language } from 'angular-l10n';

@Component({
  selector: 'miq-attribute-set',
  templateUrl: './attribute-set.component.html',
  styleUrls: ['./attribute-set.component.scss'],
})
export class AttributeSetComponent implements OnInit, OnDestroy, OnChanges {
  @Input() selectedLanguage;
  @Input() selectedCountry;
  @Input() attributesData: TranslationAttributes[];
  @Input() dataClassAttributes: TranslationAttributes[];
  @Input() selectedLanguageId;
  @Input() entity;
  @Output() attributesTranslationChanges: EventEmitter<any> = new EventEmitter();
  @Output() searchKeywords: EventEmitter<any> = new EventEmitter();
  @Output() resetAttributes: EventEmitter<any> = new EventEmitter();
  @Output() attributesSaved: EventEmitter<any> = new EventEmitter();
  translationHeaders = [
    { field: 'attrName', header: 'admin.attribute', class: 'attribute-name' },
    { field: 'attrDesc', header: 'admin.descriptionCaps', class: 'attribute-desc' },
    { field: 'localeAttrName', header: 'admin.attribute', class: 'attribute-name' },
    { field: 'localAttrDesc', header: 'admin.descriptionCaps', class: 'attribute-desc' },
  ];
  expanded: boolean = true;
  private saveTranslationsAttributes: any = [];
  @Language() lang: string;
  private translations = new Map();

  constructor(
    private adminService: AdminService,
    public translationService: TranslationService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    /** label translation purpose added */
  }

  ngOnChanges(change: SimpleChanges) {
    if (change.entity && change.entity.currentValue) {
      this.translations.clear();
    }
    const { attributesData, selectedLanguageId } = change;
    if (attributesData && this.translations.size > 0) {
      this.attributesData.forEach(sectionResult => {
        sectionResult.sectionAttrs.forEach((data, index) => {
          const translationChanges = this.translations.get(data.attrId);
          if (translationChanges) {
            sectionResult.sectionAttrs[index].localeAttrName = translationChanges.attrName;
            sectionResult.sectionAttrs[index].localAttrDesc = translationChanges.attrDescription;
          }
        });
      });
    }
    if (this.languageChangeDetection(selectedLanguageId)) {
      this.translations.clear();
    }
  }

  languageChangeDetection(selectedLanguageId: SimpleChange) {
    return (
      selectedLanguageId &&
      selectedLanguageId.currentValue &&
      selectedLanguageId.previousValue &&
      selectedLanguageId.currentValue !== selectedLanguageId.previousValue
    );
  }

  transaltionChanged(attibuteTranslations) {
    this.attributesTranslationChanges.emit(true);
    const translationAttribute = {
      attrId: attibuteTranslations.attrId,
      attrName: attibuteTranslations.localeAttrName,
      attrDescription: attibuteTranslations.localAttrDesc,
    };
    this.translations.set(translationAttribute.attrId, translationAttribute);
  }

  searchAttributes(sectionData, searchKeyword) {
    this.searchKeywords.emit({
      sectionData: sectionData,
      searchKeyword: searchKeyword.target.value,
      translatedAttributes: this.translations,
    });
  }

  saveTranslations() {
    this.translations.forEach(val => this.saveTranslationsAttributes.push(val));
    if (this.saveTranslationsAttributes.length > 0) {
      this.adminService
        .saveAttributesTranslation(this.saveTranslationsAttributes, this.selectedLanguageId, this.selectedCountry)
        .subscribe(() => {
          this.notificationService.notify({ message: this.translationService.translate('admin.successfullySaved') });
          this.saveTranslationsAttributes = [];
          this.translations.clear();
          setTimeout(() => this.attributesSaved.emit(), 1500);
        });
    } else {
      this.notificationService.notify({ message: this.translationService.translate('admin.noChanges') });
    }
    this.attributesTranslationChanges.emit(false);
  }

  resetTranslations() {
    this.translations.clear();
    this.resetAttributes.emit();
  }

  ngOnDestroy() {
    /** label translation purpose added */
  }
}
