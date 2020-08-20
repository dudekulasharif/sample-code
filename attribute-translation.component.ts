import { SaveTranslationProperties, SectionAttributes } from '@admin/models/translations.model';
import { AdminService } from '@admin/services/admin.service';
import { TitleCasePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmDialogComponent } from '@shared/dialogs/confirm-dialog/confirm-dialog.component';
import { Catalogs, ICountryLanguageList, ICountryList } from '@shared/models/icommons.model';
import { NotificationService } from '@shared/services/notification.service';
import { Language, TranslationService } from 'angular-l10n';
import * as deepmerge from 'deepmerge';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'miq-attribute-translation',
  templateUrl: './attribute-translation.component.html',
  styleUrls: ['./attribute-translation.component.scss'],
})
export class AttributeTranslationComponent implements OnInit, OnDestroy {
  countryLanguageValues: ICountryList[];
  languageValues: ICountryLanguageList[];
  catalogList: Catalogs[];
  selectedLanguage: string;
  selectedCatalog: string;
  selectedCountry: string;
  attributesSet: any = {};
  private dataClass = 'property';
  selectedTabIndex = 0;
  private attributesTranslationChange: boolean;
  dataClassAttributes: any;
  noRecords = false;
  attributesFilterObject = {
    selectedCountryId: '',
    selectedLanguageId: '',
    lobId: null,
  };
  @Language() lang: string;
  entities = ['property', 'company', 'brand', 'contact', 'lease', 'sale', 'availability', 'tim', 'tenancy'];

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService,
    private titlecasePipe: TitleCasePipe,
    public translationService: TranslationService
  ) {}

  ngOnInit() {
    this.adminService.getCountryLanguageList().subscribe(data => {
      this.countryLanguageValues = data;
      if (data) {
        this.languageValues = this.countryLanguageValues[0].languageView;
        this.getSelectedCountryData(this.countryLanguageValues[0]);
        this.getSelectedLanguageData(this.countryLanguageValues[0]);
        this.getCountryCataloglist(this.attributesFilterObject.selectedCountryId);
        this.selectedLangDataClass(this.dataClass);
      }
    });
  }

  languageSelection(event) {
    this.selectedLanguage = event.value.languageDesc;
    this.attributesFilterObject.selectedLanguageId = event.value.languageId;
    this.selectedLangDataClass(this.dataClass);
  }

  countrySelection(event) {
    this.languageValues = event.value.languageView;
    this.getSelectedCountryData(event.value);
    this.getSelectedLanguageData(event.value);
    this.getCountryCataloglist(this.attributesFilterObject.selectedCountryId);
    this.selectedLangDataClass(this.dataClass);
  }

  private getSelectedCountryData(data) {
    this.selectedCountry = data.countryName;
    this.attributesFilterObject.selectedCountryId = data.countryId;
  }

  private getSelectedLanguageData(data) {
    this.selectedLanguage = data.languageView[0].languageDesc;
    this.attributesFilterObject.selectedLanguageId = data.languageView[0].languageId;
  }

  private getCountryCataloglist(selectedCountryId) {
    this.attributesFilterObject.lobId = null;
    this.adminService.getCountryCatalogList(selectedCountryId).subscribe(data => {
      this.catalogList = data;
      const newCatalogName = {
        catalogName: 'All',
        lobId: null,
        desc: 'All',
      };
      if (data) {
        this.catalogList.unshift(newCatalogName);
      } else {
        this.catalogList = [];
        this.catalogList.push(newCatalogName);
      }
      this.selectedCatalog = this.catalogList[0].catalogName;
      this.attributesFilterObject.lobId = this.catalogList[0].lobId;
    });
  }

  catalogSelection(event) {
    this.selectedCatalog = event.value.catalogName;
    this.attributesFilterObject.lobId = event.value.lobId;
    this.selectedLangDataClass(this.dataClass);
  }

  getTabIndex(dataClassName, index: number) {
    if (this.attributesTranslationChange) {
      const dialogData = {
        message: this.translationService.translate('admin.msgUnsaved'),
        confirmText: this.translationService.translate('admin.leave'),
        cancelText: this.translationService.translate('admin.stay'),
        leaveMessage: this.translationService.translate('admin.confirmLeave'),
      };
      this.notificationService
        .openDialog(ConfirmDialogComponent, dialogData)
        .pipe(
          take(1),
          filter(switchTab => !!switchTab)
        )
        .subscribe(() => {
          this.selectedTabIndex = index;
          this.attributesTranslationChange = false;
          this.dataClass = dataClassName;
          this.selectedLangDataClass(dataClassName);
        });
    } else {
      this.selectedTabIndex = index;
      this.dataClass = dataClassName;
      this.selectedLangDataClass(dataClassName);
    }
  }

  attributesTranslationChanges(event) {
    this.attributesTranslationChange = event;
  }

  attributesSaved() {
    this.selectedLangDataClass(this.dataClass);
  }

  private selectedLangDataClass(dataclass: string) {
    this.dataClass = this.titlecasePipe.transform(dataclass);
    this.adminService
      .getTransalationAttributes(
        this.attributesFilterObject.selectedLanguageId,
        this.dataClass,
        this.attributesFilterObject.selectedCountryId,
        this.attributesFilterObject.lobId
      )
      .subscribe(data => {
        this.attributesSet[dataclass.toLowerCase()] = deepmerge([], data);
        this.dataClassAttributes = deepmerge([], data);
        this.noRecords = data ? false : true;
      });
  }

  resetAttributes() {
    this.attributesTranslationChange = false;
    this.selectedLangDataClass(this.dataClass);
    setTimeout(() => {
      this.attributesSet[this.dataClass.toLowerCase()] = deepmerge([], this.dataClassAttributes);
    }, 2000);
  }

  searchKeywords(event) {
    const result = this.dataClassAttributes.find(obj => obj.sectionTitle === event.sectionData.sectionTitle);
    const englishAttributes = this.filterAttributes(
      result.sectionAttrs,
      event.searchKeyword,
      event.translatedAttributes
    );
    event.sectionData.sectionAttrs = englishAttributes;
  }

  private filterAttributes(
    result: SectionAttributes[],
    searchString: string,
    translatedAttributes: Map<number, SaveTranslationProperties>
  ) {
    const searchResult = result.filter(data => data.attrName.toLowerCase().includes(searchString.toLowerCase()));
    searchResult.forEach((data, index) => {
      const matchedAttr = translatedAttributes.get(data.attrId);
      if (matchedAttr) {
        searchResult[index].localeAttrName = matchedAttr.attrName;
        searchResult[index].localAttrDesc = matchedAttr.attrDescription;
      }
    });
    return searchResult;
  }

  ngOnDestroy() {
    /* label translation purpose added */
  }
}
