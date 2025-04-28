import {
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Button } from 'primereact/button'
import SectionBox from '../shared/SectionBox'
import { ProductMedia, useProductMediaApi } from '../../api/productsMedia'
import { CloudinaryResponse } from '../../models/CloudinaryResponce'
import { Menu } from 'primereact/menu'
import { toBase64 } from '../../helpers/file'
import './ProductMedia.scss'
import { useUIBlocker } from '../../context/UIBlcoker'
import { Checkbox } from 'primereact/checkbox'
import { useTranslation } from 'react-i18next'

interface DisplayPic extends CloudinaryResponse {
  isMain: boolean
}

interface TmpFile extends DisplayPic {
  mimeType: string
}

interface ProductMediaProps {
  productId: string | null
}

const Image = ({
  pic,
  checked,
  handleUseAsMain,
  handleDelete,
  toggleChecked,
}: {
  pic: DisplayPic
  checked: boolean
  handleUseAsMain: (id: string) => unknown
  handleDelete: (id: string) => unknown
  toggleChecked: (id: string) => unknown
}) => {
  const menu = useRef<Menu>(null)
  const { t } = useTranslation()
  const menuItems = useMemo(() => {
    return [
      {
        label: t('products.edit.tab.media.useAsMain'),
        command: () => {
          handleUseAsMain(pic.id)
        },
      },
      {
        label: t('products.edit.tab.media.deleteImage'),
        command: () => {
          handleDelete(pic.id)
        },
      },
    ]
  }, [pic.id, handleUseAsMain, handleDelete])
  return (
    <div className="relative products-media-image mr-4">
      <Checkbox
        checked={checked}
        onChange={() => toggleChecked(pic.id)}
        className="absolute left-0 top-0 mt-2 ml-2"
      />
      <img src={pic.link} className="" alt="image" />
      <Button
        icon="pi-ellipsis-v pi"
        className="p-button-text top-0 right-0 absolute"
        style={{ color: 'white' }}
        onClick={(event) => {
          event.preventDefault()
          menu.current?.toggle(event)
        }}
        aria-controls="popup_menu"
        aria-haspopup
      />

      {pic.isMain && (
        <i
          className="pi-star-fill pi p-button-text bottom-0 left-0 ml-2 mb-2 absolute"
          style={{ color: 'white' }}
        />
      )}
      <Menu model={menuItems} popup ref={menu} id="popup_menu" />
    </div>
  )
}

const ProductImages = ({ productId }: ProductMediaProps) => {
  const { t } = useTranslation()
  const { blockPanel } = useUIBlocker()
  const [tmpPics, setTmpPics] = useState<TmpFile[]>([])
  const [pics, setPics] = useState<ProductMedia[]>([])
  const {
    addProductImageToCloudinary,
    addImageToProduct,
    syncProductImages,
    deleteProductImage,
    updateProductImage,
  } = useProductMediaApi()
  const [selected, setSelected] = useState<string[]>([])
  const [lastSelected, setLastSelected] = useState<string>('')

  const handleDelete = useCallback(
    async (mediaId: string) => {
      try {
        blockPanel(true)
        setTmpPics((prev) => prev.filter((cr) => cr.id !== mediaId))
        if (productId) {
          await deleteProductImage(productId, mediaId)
          syncData()
        }
        setSelected([])
      } finally {
        blockPanel(false)
      }
    },
    [productId]
  )

  const handleUseAsMain = useCallback(
    async (mediaId: string) => {
      const oldMain = pics.filter(
        (pic: ProductMedia) => pic.customAttributes.isMain
      )

      const newPics = pics
        .filter((pic: ProductMedia) => {
          return (
            oldMain.some(
              (oldPic) => oldPic.customAttributes.id === pic.customAttributes.id
            ) || pic.customAttributes.id === mediaId
          )
        })
        .map((pic: ProductMedia) => {
          return {
            ...pic,
            customAttributes: {
              id: pic.customAttributes.id,
              isMain: mediaId === pic.customAttributes.id,
            },
          }
        })

      const newTmpPics = tmpPics.map((pic: TmpFile) => {
        return {
          ...pic,
          isMain: mediaId === pic.id,
        }
      })
      setTmpPics(newTmpPics)
      if (!productId) {
        return
      }
      await Promise.all(
        newPics.map((pic) =>
          updateProductImage(productId, pic.customAttributes.id, pic)
        )
      )
      await syncData()
    },
    [productId, tmpPics, pics]
  )

  const mapProductMediaToDisplayPic = (pm: ProductMedia) => {
    return {
      id: pm.customAttributes.id,
      link: pm.url,
      isMain: pm.customAttributes.isMain,
    }
  }

  const combinedPics = useMemo<DisplayPic[]>(() => {
    return [
      ...pics.map(mapProductMediaToDisplayPic),
      ...tmpPics.map((tmpPic) => ({
        id: tmpPic.id,
        link: tmpPic.link,
        isMain: tmpPic.isMain,
      })),
    ]
  }, [tmpPics, pics])

  const handleBatchDelete = useCallback(
    async (e: SyntheticEvent) => {
      e.preventDefault()
      try {
        blockPanel(true)
        await Promise.all(
          selected.map((id) => {
            handleDelete(id)
          })
        )
      } finally {
        blockPanel(false)
      }
    },
    [selected]
  )

  const toggleChecked = useCallback(
    (id: string) => {
      if (selected.some((selectedId) => id === selectedId)) {
        setSelected((prev) => prev.filter((selectedId) => selectedId !== id))
      } else {
        setSelected((prev) => [...prev, id])
      }
    },
    [selected]
  )

  const addImages = useCallback(
    async (tmpPics: TmpFile[]) => {
      try {
        if (!productId) {
          return
        }
        blockPanel(true)
        await Promise.all(
          tmpPics.map(async (tmpPic) => {
            const cr = await addProductImageToCloudinary(productId, tmpPic.link)
            const cloudinaryId = cr.id.split('/')
            const mediaId = cloudinaryId.at(-1)
            if (!mediaId) {
              throw "can't read media id"
            }
            await addImageToProduct(
              productId,
              mediaId,
              cr,
              tmpPic.mimeType,
              pics.length === 0 && tmpPics.length === 0
            )
            await syncData()
          })
        )
      } finally {
        blockPanel(false)
      }
    },
    [productId]
  )

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!productId) {
        return
      }
      const fileObj = event.target.files && event.target.files[0]
      if (!fileObj) {
        return
      }
      const b64 = await toBase64(fileObj)
      const tf: TmpFile = {
        id: Date.now().toString(),
        link: b64,
        isMain: tmpPics.length === 0,
        mimeType: fileObj.type,
      }
      await addImages([tf])
      setLastSelected('')
    },
    [tmpPics, productId]
  )
  const syncData = useCallback(async () => {
    if (productId) {
      const images = await syncProductImages(productId)
      setPics(images)
    }
  }, [productId])

  useEffect(() => {
    syncData()
  }, [])

  const deleteLabel = useMemo(() => {
    return `${t('products.edit.tab.media.deleteBatch')} ${
      selected.length > 0 ? '(' + selected.length + ')' : ''
    }`
  }, [selected.length, t])

  return (
    <>
      <div className="grid grid-nogutter">
        <div className="col-6 module-subtitle mb-5 mt-3">
          {t('products.edit.tab.media.title')}
        </div>
      </div>
      <div className="col-12 grid">
        <Button
          className="p-button p-button-secondary mt-2"
          label={deleteLabel}
          disabled={selected.length === 0}
          onClick={(e) => {
            e.preventDefault()
            handleBatchDelete(e)
          }}
        />
      </div>
      <SectionBox className="col-12 mt-4 h-14rem p-4 flex flex-wrap align-items-start">
        {combinedPics.map((pic) => {
          return (
            <Image
              handleDelete={handleDelete}
              pic={pic}
              checked={selected.some((selId) => selId === pic.id)}
              handleUseAsMain={handleUseAsMain}
              key={pic.id}
              toggleChecked={toggleChecked}
            />
          )
        })}
        <div className="relative">
          <div className="products-media-add-image flex justify-content-center align-items-center flex-column">
            <label
              className="p-button p-button-secondary mt-2"
              htmlFor="upload-image"
            >
              {t('products.edit.tab.media.addImage')}
            </label>
            <input
              type="file"
              name="photo"
              id="upload-image"
              value={lastSelected}
              onChange={handleFileChange}
            />
          </div>
        </div>
      </SectionBox>
    </>
  )
}

export default ProductImages
